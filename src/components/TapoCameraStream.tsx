'use client';

import { useEffect, useRef, useState } from 'react';
import { TapoCameraConfig, getRTSPUrl } from '@/lib/tapo-stream';

interface TapoCameraStreamProps {
  camera: TapoCameraConfig;
  width?: number;
  height?: number;
  autoplay?: boolean;
  onlyWhenActive?: boolean;
}

const RELAY_API_BASE = '/api/relay';

type StreamStatus = 'idle' | 'registering' | 'connecting' | 'playing' | 'error' | 'stalled' | 'sleeping';

export default function TapoCameraStream({
  camera,
  width = 640,
  height = 360,
  autoplay = true,
  onlyWhenActive = false,
}: TapoCameraStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isStartingRef = useRef(false);

  const startStream = async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setStatus('registering');
    setErrorMsg(null);

    // 1. Register camera with relay server -> get WS port
    let wsPort: number = 0;
    try {
      let lastErr = '';
      let registered = false;

      for (let attempt = 0; attempt < 2 && !registered; attempt++) {
        const res = await fetch(`${RELAY_API_BASE}/camera`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: camera.id,
            name: camera.name,
            rtspUrl: getRTSPUrl(camera),
          }),
        });

        if (res.ok) {
          ({ wsPort } = await res.json());
          registered = true;
          break;
        }

        const err = await res.json().catch(() => ({ error: `Server responded with ${res.status}` }));
        lastErr = err.error || `Server responded with ${res.status}`;

        if (attempt === 0 && lastErr.toLowerCase().includes('could not reach relay')) {
          await fetch('/api/relay/start', { method: 'POST' }).catch(() => {});
          await new Promise((r) => setTimeout(r, 1200));
        }
      }

      if (!registered) throw new Error(lastErr || 'Failed to register stream');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(
        e.message?.includes('fetch') || String(e.message || '').toLowerCase().includes('relay')
          ? 'Relay offline. Starting automatically... retry in 2s.'
          : `Failed to start stream: ${e.message}`
      );
      isStartingRef.current = false;
      return;
    }

    // 2. Connect JSMpeg to the WebSocket
    setStatus('connecting');
    try {
      const JSMpeg = (await import('jsmpeg-player')).default;

      if (!canvasRef.current) {
        isStartingRef.current = false;
        return;
      }

      // Destroy previous player if any
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const wsHost = window.location.hostname || 'localhost';
      playerRef.current = new JSMpeg.Player(`ws://${wsHost}:${wsPort}`, {
        canvas: canvasRef.current,
        autoplay,
        audio: false,
        videoBufferSize: 512 * 1024,
        onPlay: () => setStatus('playing'),
        onStalled: () => setStatus('stalled'),
      });
      isStartingRef.current = false;
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(`Player error: ${e.message}`);
      isStartingRef.current = false;
    }
  };

  const stopStream = (stopRelay = false) => {
    if (stopRelay) {
      fetch(`${RELAY_API_BASE}/camera/${encodeURIComponent(camera.id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  };

  const checkCameraActive = async () => {
    try {
      const res = await fetch('/api/camera/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraIp: camera.ip }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.active);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      if (cancelled) return;

      if (!onlyWhenActive) {
        if (autoplay) startStream();
        return;
      }

      const active = await checkCameraActive();
      if (cancelled) return;

      if (active) {
        if (!playerRef.current && !isStartingRef.current) {
          startStream();
        }
      } else {
        setStatus('sleeping');
        setErrorMsg(null);
        stopStream(true);
      }
    };

    run();
    if (onlyWhenActive) interval = setInterval(run, 15000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      // Delay stop to avoid premature teardown during React dev effect re-runs.
      stopTimerRef.current = setTimeout(() => {
        stopStream(false);
      }, 1200);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.id, camera.ip, onlyWhenActive]);

  const statusColor: Record<StreamStatus, string> = {
    idle:        '#6b7280',
    registering: '#f59e0b',
    connecting:  '#3b82f6',
    playing:     '#22c55e',
    error:       '#ef4444',
    stalled:     '#f59e0b',
    sleeping:    '#9ca3af',
  };

  const statusLabel: Record<StreamStatus, string> = {
    idle:        'Idle',
    registering: 'Starting...',
    connecting:  'Connecting...',
    playing:     'Live',
    error:       'Error',
    stalled:     'Stalled',
    sleeping:    'Waiting activity',
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: 'auto', display: 'block' }} />

        {/* Overlay for non-playing states */}
        {status !== 'playing' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            gap: 12, padding: 16,
          }}>
            {status === 'error' ? (
              <>
                <span style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>{errorMsg}</span>
                <button
                  onClick={startStream}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: '#3b82f6', color: '#fff', fontSize: 13,
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              </>
            ) : (
              <span style={{ color: '#fff', fontSize: 14 }}>{statusLabel[status]}</span>
            )}
          </div>
        )}
      </div>

      {/* Camera info bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{camera.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: statusColor[status] }}>{statusLabel[status]}</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[status] }} />
        </div>
      </div>
    </div>
  );
}
