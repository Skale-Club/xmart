const Stream = require('node-rtsp-stream');

const WS_PORT_START = 9001;

interface RelayRegistration {
  id: string;
  name?: string;
  rtspUrl: string;
}

interface ActiveRelayStream {
  stream: any;
  wsPort: number;
  name: string;
  rtspUrl: string;
  startedAt: string;
}

interface RelayState {
  activeStreams: Map<string, ActiveRelayStream>;
  nextWsPort: number;
  booted: boolean;
}

type RelayGlobal = typeof globalThis & {
  __xmarteRelayState?: RelayState;
};

function getRelayState(): RelayState {
  const g = globalThis as RelayGlobal;

  if (!g.__xmarteRelayState) {
    g.__xmarteRelayState = {
      activeStreams: new Map(),
      nextWsPort: WS_PORT_START,
      booted: false,
    };
  }

  return g.__xmarteRelayState;
}

function getFfmpegPath(): string {
  let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  try {
    ffmpegPath = ffmpegPath === 'ffmpeg' ? require('ffmpeg-static') || 'ffmpeg' : ffmpegPath;
  } catch {
    // Fall back to system ffmpeg if bundled binary is unavailable.
  }

  return ffmpegPath;
}

export function ensureRelayRunning(): { started: boolean } {
  const state = getRelayState();
  const started = !state.booted;
  state.booted = true;
  return { started };
}

export function getRelayStatus() {
  const state = getRelayState();

  return {
    online: state.booted,
    streams: Array.from(state.activeStreams.entries()).map(([id, entry]) => ({
      id,
      name: entry.name,
      wsPort: entry.wsPort,
      wsUrl: `ws://localhost:${entry.wsPort}`,
      startedAt: entry.startedAt,
    })),
  };
}

export function registerRelayCamera({ id, name, rtspUrl }: RelayRegistration) {
  const state = getRelayState();
  ensureRelayRunning();

  const existing = state.activeStreams.get(id);
  if (existing) {
    return { wsPort: existing.wsPort };
  }

  const wsPort = state.nextWsPort++;
  const stream = new Stream({
    name: name || id,
    streamUrl: rtspUrl,
    wsPort,
    ffmpegPath: getFfmpegPath(),
    ffmpegOptions: {
      '-rtsp_transport': 'tcp',
      '-rtsp_flags': 'prefer_tcp',
      '-rw_timeout': '5000000',
      '-stats': '',
      '-r': 25,
      '-s': '640x360',
      '-an': '',
      '-b:v': '512k',
    },
  });

  state.activeStreams.set(id, {
    stream,
    wsPort,
    name: name || id,
    rtspUrl,
    startedAt: new Date().toISOString(),
  });

  return { wsPort };
}

export function removeRelayCamera(id: string) {
  const state = getRelayState();
  const existing = state.activeStreams.get(id);

  if (!existing) {
    return false;
  }

  try {
    existing.stream.stop?.();
  } catch {
    // Ignore teardown failures from relay internals.
  }

  state.activeStreams.delete(id);
  return true;
}
