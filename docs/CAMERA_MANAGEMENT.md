# Camera Management Guide

Complete guide for managing Tapo cameras dynamically through the UI.

## Overview

The camera management system allows you to add, update, and remove Tapo cameras directly from the web interface without editing configuration files. All camera credentials are securely stored in Supabase.

## Features

✅ **Add cameras via UI** - No need to edit `.env` files
✅ **Persistent storage** - Cameras saved to Supabase database
✅ **Local caching** - Zustand store with localStorage persistence
✅ **Test connection** - Verify camera settings before saving
✅ **Easy removal** - Delete cameras with one click
✅ **Grid and single view** - Multiple viewing modes

## Getting Started

### 1. Database Setup

First, apply the schema and auth structure to your Supabase project:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 2. Access Camera Management

Navigate to the cameras page:
```
http://localhost:4000/cameras
```

### 3. Add Your First Camera

1. Click the **"Add Device"** button
2. Fill in the camera information:
   - **Camera Name**: e.g., "Front Door", "Backyard"
   - **IP Address**: Find in your router or Tapo app
   - **Username**: Device account username (not your Tapo cloud account)
   - **Password**: Device account password
   - **Stream Quality**: Choose stream1 (HD) or stream2 (SD)

3. (Optional) Click **"Test Connection"** to verify settings
4. Click **"Add Camera"** to save

### 4. View Live Streams

After adding cameras:
1. Start the RTSP WebSocket server (in a separate terminal):
   ```bash
   node server/rtsp-websocket-server.js
   ```
2. Refresh the cameras page
3. Your live streams should appear automatically

## Creating a Device Account

**Important:** You must create a "Device Account" in the Tapo app for RTSP access.

### Steps:

1. Open the **Tapo app** on your phone
2. Select your camera
3. Tap the **Settings** gear icon (top right)
4. Go to **Advanced Settings**
5. Select **Device Account**
6. Tap **Add** to create a new account
7. Enter a username and password
   - This is separate from your Tapo cloud account
   - Use a strong, unique password
   - Remember these credentials for the web interface

## Camera Management Operations

### Adding Cameras

**UI Method (Recommended):**
1. Click "Add Device" button
2. Enter camera details in the modal
3. Test connection (optional but recommended)
4. Save

**API Method:**
```bash
curl -X POST http://localhost:4000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room",
    "ip": "192.168.1.100",
    "username": "tapoadmin",
    "password": "mypassword",
    "stream": "stream1"
  }'
```

### Listing Cameras

**API Method:**
```bash
curl http://localhost:4000/api/cameras
```

**Response:**
```json
{
  "cameras": [
    {
      "id": "uuid-here",
      "name": "Front Door",
      "ip": "192.168.1.100",
      "username": "tapoadmin",
      "stream": "stream1",
      "enabled": true,
      "created_at": "2026-03-08T10:00:00Z"
    }
  ]
}
```

### Updating Cameras

**API Method:**
```bash
curl -X PUT http://localhost:4000/api/cameras/[camera-id] \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "stream": "stream2"
  }'
```

### Removing Cameras

**UI Method:**
1. Hover over camera card
2. Click the red trash icon
3. Confirm deletion

**API Method:**
```bash
curl -X DELETE http://localhost:4000/api/cameras/[camera-id]
```

## Storage Architecture

### Local Storage (Zustand)

Cameras are cached in browser localStorage for instant access:
- **Key**: `camera-storage`
- **Persistence**: Survives page refreshes
- **Scope**: Per browser/device

### Database Storage (Supabase)

Cameras are permanently stored in Supabase:
- **Table**: `cameras`
- **Encryption**: Passwords stored as plain text (consider encrypting in production)
- **Access**: Shared across all devices

### Sync Strategy

Currently, the app uses **localStorage-first** approach:
- Cameras added via UI are stored locally
- Optionally, you can sync to Supabase via API

**Future Enhancement:** Automatic sync between localStorage and Supabase

## Security Considerations

### ⚠️ Important Security Notes

1. **Plain Text Passwords**
   - Camera passwords are currently stored in plain text
   - **Production**: Implement encryption before deployment
   - Consider using environment variables for sensitive cameras

2. **Local Network Only**
   - RTSP streams are unencrypted
   - Only use on trusted local networks
   - Never expose RTSP ports to the internet

3. **Device Account Best Practices**
   - Use strong, unique passwords
   - Different from your Tapo cloud account
   - Rotate credentials periodically

4. **Row Level Security (RLS)**
   - Currently allows anonymous access (development only)
   - **Production**: Implement proper authentication
   - Add user-specific RLS policies

### Recommended Production Security

```sql
-- Example: Restrict camera access to authenticated users only
CREATE POLICY "Authenticated users only" ON cameras
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Remove anonymous access policy
DROP POLICY "Allow anonymous operations" ON cameras;
```

## Finding Your Camera IP Address

### Method 1: Tapo App
1. Open Tapo app
2. Select your camera
3. Tap settings gear
4. Scroll to "Device Info"
5. Look for "IP Address"

### Method 2: Router Admin Panel
1. Log into your router (usually 192.168.1.1 or 192.168.0.1)
2. Find DHCP client list or connected devices
3. Look for devices named "Tapo" or the camera model
4. Note the IP address

### Method 3: Network Scanner
```bash
# Windows
arp -a

# Mac/Linux
arp -a | grep -i tapo

# Or use tools like Advanced IP Scanner (Windows) or Angry IP Scanner (cross-platform)
```

## Troubleshooting

### Camera Won't Add

**Check:**
- ✓ IP address format is correct (e.g., 192.168.1.100)
- ✓ Camera is powered on and connected to WiFi
- ✓ Device account credentials are correct
- ✓ You're using Device Account, not Tapo cloud account

**Solution:**
- Use "Test Connection" button to verify settings
- Ping the camera IP to ensure network connectivity
- Recreate device account in Tapo app

### Stream Not Appearing

**Check:**
- ✓ RTSP WebSocket server is running
- ✓ Server is configured with correct camera details
- ✓ Firewall allows ports 554, 9999, 9998
- ✓ Camera supports RTSP (most Tapo models do)

**Solution:**
```bash
# 1. Stop the server
# 2. Update server/rtsp-websocket-server.js with new camera
# 3. Restart server
node server/rtsp-websocket-server.js
```

### Connection Test Fails

**Possible Causes:**
- Wrong IP address
- Camera offline or disconnected
- Incorrect credentials
- RTSP not enabled (rare, usually enabled by default)

**Solution:**
- Verify camera is accessible: `ping [camera-ip]`
- Test with VLC: Open Network Stream → `rtsp://user:pass@ip:554/stream1`
- Check Tapo app shows camera online

### Database Errors

**Error: "Table cameras does not exist"**

**Solution:**
- Run the schema SQL in Supabase dashboard
- Check database connection in `.env.local`
- Verify Supabase project is active

## Stream Quality Comparison

| Stream | Resolution | Bitrate | Use Case |
|--------|-----------|---------|----------|
| stream1 | 1080p HD | ~2-4 Mbps | High quality viewing, recording |
| stream2 | 360p SD | ~500 Kbps | Low bandwidth, multiple cameras |

**Recommendation:**
- Start with `stream1` for best quality
- Switch to `stream2` if experiencing lag
- Use `stream2` when viewing 4+ cameras simultaneously

## API Reference

### Endpoints

- `GET /api/cameras` - List all cameras
- `POST /api/cameras` - Create new camera
- `GET /api/cameras/[id]` - Get camera details
- `PUT /api/cameras/[id]` - Update camera
- `DELETE /api/cameras/[id]` - Delete camera
- `POST /api/camera/stream` - Test RTSP connection

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed documentation.

## Database Schema

```sql
CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    stream VARCHAR(10) DEFAULT 'stream1',
    port INTEGER DEFAULT 554,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Future Enhancements

- [ ] Automatic sync between localStorage and Supabase
- [ ] Password encryption in database
- [ ] Camera thumbnail previews
- [ ] Motion detection alerts
- [ ] Recording scheduler
- [ ] Camera grouping by location
- [ ] PTZ (Pan-Tilt-Zoom) controls for supported models
- [ ] Two-way audio support
- [ ] Export recordings to cloud storage

## Resources

- [Tapo Camera Setup Guide](./TAPO_CAMERA_SETUP.md)
- [API Reference](./API_REFERENCE.md)
- [Project Overview](./PROJECT_OVERVIEW.md)
- [Supabase Documentation](https://supabase.com/docs)

---

Last updated: 2026-03-08
