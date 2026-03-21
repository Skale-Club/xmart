/**
 * RTSP WebSocket Relay Server — Dynamic
 *
 * Converts RTSP streams from Tapo cameras to WebSocket streams for JSMpeg.
 * Cameras are registered dynamically via HTTP API.
 *
 * Run: node server/rtsp-websocket-server.js
 *
 * API:
 *   GET  /health            — list active streams
 *   POST /camera            — start stream { id, name, rtspUrl } → { wsPort }
 *   DELETE /camera/:id      — stop stream
 */

const Stream = require('node-rtsp-stream');
const http = require('http');

const HTTP_PORT = 9997;
const WS_PORT_START = 9001; // ports 9001, 9002, 9003... assigned per camera

let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
try {
  // Bundled ffmpeg binary fallback for environments without system ffmpeg.
  ffmpegPath = ffmpegPath === 'ffmpeg' ? require('ffmpeg-static') || 'ffmpeg' : ffmpegPath;
} catch (_) {}

let nextWsPort = WS_PORT_START;
// Map<cameraId, { stream, wsPort, name }>
const activeStreams = new Map();

// ─── HTTP Server ────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS — allow requests from the Next.js dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    const streams = [...activeStreams.entries()].map(([id, s]) => ({
      id,
      name: s.name,
      wsPort: s.wsPort,
      wsUrl: `ws://localhost:${s.wsPort}`,
    }));
    json(res, 200, { status: 'ok', streams });
    return;
  }

  // POST /camera — register & start a stream
  if (req.method === 'POST' && req.url === '/camera') {
    readBody(req, (err, body) => {
      if (err) { json(res, 400, { error: 'Invalid JSON' }); return; }

      const { id, name, rtspUrl } = body;
      if (!id || !rtspUrl) {
        json(res, 400, { error: 'id and rtspUrl are required' });
        return;
      }

      // Already running — return existing port
      if (activeStreams.has(id)) {
        json(res, 200, { wsPort: activeStreams.get(id).wsPort });
        return;
      }

      const wsPort = nextWsPort++;
      console.log(`[+] Starting stream "${name || id}" on ws://localhost:${wsPort}`);
      console.log(`    RTSP: ${rtspUrl}`);

      try {
        const stream = new Stream({
          name: name || id,
          streamUrl: rtspUrl,
          wsPort,
          ffmpegPath,
          ffmpegOptions: {
            // Tapo cameras are much more reliable over TCP than default UDP transport.
            '-rtsp_transport': 'tcp',
            '-rtsp_flags': 'prefer_tcp',
            '-rw_timeout': '5000000',
            '-stats': '',
            // mpeg1video accepts a limited set of framerates; 25 is broadly compatible.
            '-r': 25,
            '-s': '640x360',
            // JSMpeg in this app is video-only.
            '-an': '',
            '-b:v': '512k',
          },
        });

        activeStreams.set(id, { stream, wsPort, name: name || id });
        console.log(`    ✓ Stream ready on ws://localhost:${wsPort}`);
        json(res, 200, { wsPort });
      } catch (e) {
        console.error(`    ✗ Failed to start stream:`, e.message);
        json(res, 500, { error: e.message });
      }
    });
    return;
  }

  // DELETE /camera/:id — stop stream
  if (req.method === 'DELETE' && req.url.startsWith('/camera/')) {
    const id = decodeURIComponent(req.url.slice('/camera/'.length));

    if (!activeStreams.has(id)) {
      json(res, 404, { error: 'Stream not found' });
      return;
    }

    try {
      activeStreams.get(id).stream.stop();
    } catch (_) {}
    activeStreams.delete(id);
    console.log(`[-] Stopped stream "${id}"`);
    json(res, 200, { ok: true });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(HTTP_PORT, () => {
  console.log('\n=================================');
  console.log(' RTSP WebSocket Relay Server');
  console.log('=================================');
  console.log(` Control API : http://localhost:${HTTP_PORT}`);
  console.log(` Health      : http://localhost:${HTTP_PORT}/health`);
  console.log(` WS ports    : ${WS_PORT_START}+  (one per camera)`);
  console.log(` FFmpeg      : ${ffmpegPath}`);
  console.log('=================================\n');
  console.log('Waiting for camera registrations...\n');
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req, cb) {
  let raw = '';
  req.on('data', chunk => (raw += chunk));
  req.on('end', () => {
    try { cb(null, JSON.parse(raw)); } catch (e) { cb(e); }
  });
}

// ─── Graceful shutdown ──────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\nShutting down streams...');
  activeStreams.forEach((s, id) => {
    console.log(`  Stopping "${id}"...`);
    try { s.stream.stop(); } catch (_) {}
  });
  process.exit(0);
});
