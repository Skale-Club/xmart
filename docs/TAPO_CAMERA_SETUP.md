# Tapo Camera Live Stream Integration

This guide explains how to set up live streaming from TP-Link Tapo cameras in your Next.js application.

## Features

✅ Live RTSP streaming from Tapo cameras
✅ Multi-camera grid view and single camera view
✅ Low latency (< 1 second) streaming via WebSocket
✅ Support for HD (1080p) and SD (360p) streams
✅ React component for easy integration

## Prerequisites

1. **TP-Link Tapo Camera** (models with RTSP support: C100, C200, C210, C310, etc.)
2. **FFmpeg** available (this project now uses bundled `ffmpeg-static` as fallback)
3. **Node.js** v16 or higher
4. **Local network** access to your cameras

### Important Model Note (C120 and C403 Solar)

- **C120**: usually works with RTSP (`stream1`/`stream2`) when Device Account is configured.
- **C403 Solar**: battery/solar models may not expose RTSP/ONVIF reliably. If RTSP is unavailable, this app's current relay pipeline (RTSP -> FFmpeg -> WebSocket) cannot stream it.
- In Tapo app, enable **Third-Party Compatibility**:
  - `Me -> Tapo Lab -> Third-Party Compatibility -> On`

## Step 1: Enable RTSP on Tapo Camera

### Create a Device Account

1. Open the **Tapo app** on your phone
2. Select your camera
3. Go to **Settings** (gear icon)
4. Navigate to **Advanced Settings**
5. Select **Device Account**
6. Create a new account with:
   - Username (e.g., `tapoadmin`)
   - Password (strong password recommended)
7. **Important:** This is different from your Tapo cloud account - it's a local device account for RTSP access

### Verify RTSP is Enabled

- RTSP is automatically enabled on most Tapo cameras
- Default port: **554**
- Stream paths:
  - `stream1` - High quality (1080p)
  - `stream2` - Low quality (360p)

## Step 2: Install FFmpeg

### Windows
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

### macOS
```bash
brew install ffmpeg
```

### Linux
```bash
sudo apt-get install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

## Step 3: Configure Environment Variables

Edit your `.env.local` file and update the camera settings:

```env
# Camera 1
TAPO_CAMERA_1_NAME="Front Door"
TAPO_CAMERA_1_IP=192.168.1.100
TAPO_CAMERA_1_USERNAME=tapoadmin
TAPO_CAMERA_1_PASSWORD=your_device_password
TAPO_CAMERA_1_RTSP=rtsp://tapoadmin:your_device_password@192.168.1.100:554/stream1

# Camera 2 (optional)
TAPO_CAMERA_2_NAME="Backyard"
TAPO_CAMERA_2_IP=192.168.1.101
TAPO_CAMERA_2_USERNAME=tapoadmin
TAPO_CAMERA_2_PASSWORD=your_device_password
TAPO_CAMERA_2_RTSP=rtsp://tapoadmin:your_device_password@192.168.1.101:554/stream1
```

**Important:**
- Use the **Device Account** credentials, not your Tapo cloud account
- Replace IP addresses with your actual camera IPs
- Check your router's DHCP settings to find camera IPs
- Consider setting static IPs for your cameras

## Step 4: Update Camera Configuration

Edit `server/rtsp-websocket-server.js` to match your camera setup:

```javascript
const cameras = [
  {
    id: 'camera1',
    name: 'Front Door',
    rtspUrl: process.env.TAPO_CAMERA_1_RTSP,
    wsPort: 9999,
  },
  {
    id: 'camera2',
    name: 'Backyard',
    rtspUrl: process.env.TAPO_CAMERA_2_RTSP,
    wsPort: 9998,
  },
];
```

## Step 5: Start the RTSP WebSocket Server

Open a **separate terminal** and run:

```bash
node server/rtsp-websocket-server.js
```

You should see:
```
Starting stream for Front Door on port 9999...
✓ Front Door streaming on ws://localhost:9999
...
Health check: http://localhost:9997/health
```

**Keep this terminal running** while using the camera streams.

## Step 6: Start Your Next.js App

In another terminal:

```bash
npm run dev -- -p 4000
```

## Step 7: View Camera Streams

Open your browser and navigate to:
```
http://localhost:4000/cameras
```

You should see your camera streams in grid view!

## RTSP URL Format

```
rtsp://[username]:[password]@[camera-ip]:554/[stream]
```

Examples:
- HD Stream: `rtsp://tapoadmin:mypassword@192.168.1.100:554/stream1`
- SD Stream: `rtsp://tapoadmin:mypassword@192.168.1.100:554/stream2`

## Troubleshooting

### Stream Not Connecting

1. **Verify camera IP:**
   ```bash
   ping 192.168.1.100
   ```

2. **Test RTSP URL directly with VLC:**
   - Open VLC Media Player
   - Media → Open Network Stream
   - Paste your RTSP URL
   - If this works, the camera is configured correctly

3. **Check firewall:**
   - Allow port 554 (RTSP)
   - Allow WebSocket ports (9999, 9998, 9997)

4. **Check Tapo limitations:**
   - Camera may allow only a limited number of simultaneous streams.
   - Some firmwares disable RTSP/ONVIF if Tapo Care and SD recording are active together.
   - For battery/solar devices (for example C403 Solar), RTSP may be unavailable by design.

### Poor Performance / Lag

1. **Use stream2 instead of stream1** (360p instead of 1080p)
2. **Reduce bitrate** in `rtsp-websocket-server.js`:
   ```javascript
   '-b:v': '500k', // Lower bitrate
   ```
3. **Ensure strong WiFi signal** to cameras
4. **Use wired Ethernet** connection for cameras if possible

### Error: "FFmpeg not found"

- Ensure FFmpeg is installed and in your PATH
- Restart your terminal after installing FFmpeg
- On Windows, you may need to add FFmpeg to system PATH manually

### Camera Offline

1. Check camera power
2. Verify network connection
3. Restart camera (unplug for 10 seconds)
4. Check router DHCP lease hasn't changed camera IP

## Security Considerations

⚠️ **Important Security Notes:**

1. **Local Network Only:** RTSP streams are not encrypted. Only use on trusted local networks.
2. **Do not expose** RTSP ports to the internet
3. **Strong passwords:** Use strong passwords for device accounts
4. **Firewall:** Configure firewall to restrict access to RTSP and WebSocket ports
5. **HTTPS:** In production, serve your app over HTTPS
6. **Authentication:** Add authentication to your Next.js app to restrict camera access

## Component Usage

You can use the `TapoCameraStream` component anywhere in your app:

```tsx
import TapoCameraStream from '@/components/TapoCameraStream';

function MyComponent() {
  const camera = {
    id: 'camera1',
    name: 'Front Door',
    ip: '192.168.1.100',
    username: 'tapoadmin',
    password: 'mypassword',
    stream: 'stream1',
  };

  return (
    <TapoCameraStream
      camera={camera}
      width={640}
      height={360}
      autoplay={true}
    />
  );
}
```

## Advanced Configuration

### Adding More Cameras

1. Add camera config to `.env.local`
2. Add camera to `server/rtsp-websocket-server.js` with a unique port
3. Update `src/app/cameras/page.tsx` to include the new camera

### Recording Streams

The `node-rtsp-stream` library can be extended to save recordings. Consider using FFmpeg directly:

```bash
ffmpeg -i rtsp://user:pass@ip:554/stream1 -c copy output.mp4
```

## Resources

- [TP-Link Tapo RTSP Documentation](https://www.tp-link.com/us/support/faq/2680/)
- [node-rtsp-stream GitHub](https://github.com/kyriesent/node-rtsp-stream)
- [JSMpeg Player](https://github.com/phoboslab/jsmpeg)

## Support

For issues specific to:
- **Tapo cameras:** Contact TP-Link support
- **RTSP streaming:** Check FFmpeg and node-rtsp-stream documentation
- **This integration:** Open an issue in your project repository

---

**Sources:**
- [How to View Tapo Camera on PC, NAS, or NVR Using RTSP/ONVIF](https://www.tp-link.com/us/support/faq/2680/)
- [tapo-rtsp-relay GitHub Repository](https://github.com/mschidu/tapo-rtsp-relay)
