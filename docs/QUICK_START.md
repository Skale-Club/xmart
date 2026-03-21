# Quick Start Guide

Get up and running with xmarte in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Supabase CLI installed
- TP-Link Tapo camera (optional)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   KEEPALIVE_SECRET=your-random-keepalive-secret
   ```

## Step 3: Setup Database and Auth

1. Log in to the Supabase CLI:
   ```bash
   supabase login
   ```
2. Link this repo to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push the migrations:
   ```bash
   supabase db push
   ```
4. Start the app and create your first user at `/login`.

## Step 4: Start the App

```bash
npm run dev -- -p 4000
```

Open `http://localhost:4000`, go to `/login`, and create your account.

## Step 5: Add a Camera

### A. Create Device Account in Tapo App

1. Open Tapo app and select the camera.
2. Go to `Settings -> Advanced Settings -> Device Account`.
3. Create a username and password for RTSP access.

### B. Find Camera IP

- Tapo app: `Settings -> Device Info -> IP Address`
- Router: check the DHCP client list

### C. Add Camera via UI

1. Go to `http://localhost:4000/cameras`
2. Click `Add Camera`
3. Fill in:
   - Name
   - IP
   - Username
   - Password
   - Stream (`stream1` or `stream2`)
4. Click `Test`
5. Click `Add Camera`

### D. Start RTSP Server

Open a new terminal:

```bash
node server/rtsp-websocket-server.js
```

### E. View Live Stream

Refresh `http://localhost:4000/cameras`.

## Common Issues

### "Cannot connect to Supabase"

Check `.env.local`, run `supabase db push`, and confirm the repo is linked with `supabase link`.

### "Camera won't connect"

- Verify the camera IP
- Ensure you are using the Device Account, not the Tapo cloud account
- Check Wi-Fi/network reachability

### "Stream not showing"

- Make sure `node server/rtsp-websocket-server.js` is running
- Check firewall rules for the required local ports
- Try `stream2` instead of `stream1`

## Helpful Commands

```bash
# Start dev server
npm run dev -- -p 4000

# Start RTSP server
node server/rtsp-websocket-server.js

# Link project and apply schema
supabase link --project-ref your-project-ref
supabase db push

# Check Supabase connection
curl http://localhost:4000/api/test-supabase
```

## Preventing Supabase Pausing

This project includes a GitHub Actions keepalive that pings `/api/cron/supabase-keepalive` every 4 hours.

1. Deploy your app.
2. Set `KEEPALIVE_SECRET` in the deployed app.
3. Add `KEEPALIVE_URL` and `KEEPALIVE_SECRET` as GitHub Actions secrets.
4. Keep `.github/workflows/supabase-keepalive.yml` enabled.

## Need Help?

- Read the other docs in this folder
- Check [Camera Management](./CAMERA_MANAGEMENT.md)
- Check [API Reference](./API_REFERENCE.md)
