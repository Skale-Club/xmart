import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

interface CameraStreamRequest {
  cameraIp: string;
  username: string;
  password: string;
  stream?: 'stream1' | 'stream2'; // stream1 = high quality, stream2 = 360p
}

export async function POST(request: NextRequest) {
  try {
    const body: CameraStreamRequest = await request.json();
    const { cameraIp, username, password, stream = 'stream1' } = body;

    if (!cameraIp || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: cameraIp, username, password' },
        { status: 400 }
      );
    }

    const rtspUrl = `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cameraIp}:554/${stream}`;

    let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    try {
      ffmpegPath = ffmpegPath === 'ffmpeg' ? require('ffmpeg-static') || 'ffmpeg' : ffmpegPath;
    } catch (_) {}

    const probe = await probeRtsp(rtspUrl, ffmpegPath);
    if (!probe.ok) {
      return NextResponse.json({ error: probe.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      streamType: stream,
      message: 'RTSP connection successful',
    });
  } catch (error) {
    console.error('Camera stream error:', error);
    return NextResponse.json(
      { error: 'Failed to process camera stream request' },
      { status: 500 }
    );
  }
}

function probeRtsp(rtspUrl: string, ffmpegPath: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      '-rtsp_transport', 'tcp',
      '-rw_timeout', '5000000',
      '-i', rtspUrl,
      '-frames:v', '1',
      '-f', 'null',
      '-',
    ];

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill('SIGKILL');
      resolve({ ok: false, error: 'Timeout connecting to camera RTSP. Check IP/network.' });
    }, 8000);

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ ok: false, error: 'FFmpeg unavailable. Check relay/server setup.' });
    });

    proc.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (code === 0) {
        resolve({ ok: true });
        return;
      }

      const out = stderr.toLowerCase();
      if (out.includes('401') || out.includes('unauthorized') || out.includes('authentication')) {
        resolve({ ok: false, error: 'RTSP authentication failed. Check Device Account username/password.' });
        return;
      }
      if (out.includes('connection refused') || out.includes('failed to connect') || out.includes('timed out')) {
        resolve({ ok: false, error: 'Cannot reach camera RTSP port 554. Check IP, network and firewall.' });
        return;
      }
      if (out.includes('not found') && out.includes('stream')) {
        resolve({ ok: false, error: 'Invalid stream path. Try stream1 or stream2.' });
        return;
      }

      resolve({ ok: false, error: 'RTSP test failed. Verify camera supports RTSP (battery/solar models may not).' });
    });
  });
}
