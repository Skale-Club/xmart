'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Play, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './RelayServerStatus.module.css';

type Status = 'checking' | 'online' | 'offline' | 'starting';

export default function RelayServerStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string | null>(null);
  const [activeStreams, setActiveStreams] = useState(0);
  const [autoStartTried, setAutoStartTried] = useState(false);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const res = await fetch('/api/relay/status');
      const data = await res.json();
      setStatus(data.online ? 'online' : 'offline');
      setActiveStreams(data.streams?.length ?? 0);
      setError(null);
    } catch {
      setStatus('offline');
    }
  }, []);

  const start = async () => {
    setStatus('starting');
    setError(null);
    try {
      const res = await fetch('/api/relay/start', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'started' || data.status === 'already_running') {
        setStatus('online');
      } else {
        setStatus('offline');
        setError(data.error ?? 'Failed to start server.');
      }
    } catch {
      setStatus('offline');
      setError('Could not reach Next.js API. Is the dev server running?');
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [check]);

  useEffect(() => {
    if (status === 'offline' && !autoStartTried) {
      setAutoStartTried(true);
      start();
    }
  }, [status, autoStartTried]);

  const isStarting = status === 'starting' || status === 'checking';

  return (
    <div className={`${styles.bar} ${styles[status]}`}>
      <div className={styles.left}>
        {status === 'online' ? (
          <Wifi size={15} />
        ) : isStarting ? (
          <RefreshCw size={15} className={styles.spin} />
        ) : (
          <WifiOff size={15} />
        )}

        <span className={styles.label}>
          {status === 'online'
            ? `Relay server online${activeStreams > 0 ? ` · ${activeStreams} stream${activeStreams !== 1 ? 's' : ''}` : ''}`
            : status === 'starting'
            ? 'Starting relay server…'
            : status === 'checking'
            ? 'Checking relay server…'
            : 'Relay server offline'}
        </span>

        {error && (
          <span className={styles.errorHint}>
            <AlertCircle size={13} />
            {error}
          </span>
        )}
      </div>

      <div className={styles.right}>
        {status === 'offline' && (
          <button className={styles.startBtn} onClick={start}>
            <Play size={13} />
            Start Server
          </button>
        )}
        <button className={styles.refreshBtn} onClick={check} title="Refresh status" disabled={isStarting}>
          <RefreshCw size={13} className={isStarting ? styles.spin : ''} />
        </button>
      </div>
    </div>
  );
}
