# xmarte - Home Automation System

A personalized home automation system built with Next.js and React, featuring smart device control and live camera streaming from TP-Link Tapo cameras.

> 📚 **[Complete Documentation](./docs/README.md)** | [API Reference](./docs/API_REFERENCE.md) | [Docker Deployment](./docs/DOCKER.md) | [Tapo Camera Setup](./docs/TAPO_CAMERA_SETUP.md) | [Project Overview](./docs/PROJECT_OVERVIEW.md)

## Features

- 🏠 **Dashboard** - Overview of all your smart devices with quick stats
- 📹 **Live Camera Streams** - Add and manage TP-Link Tapo cameras with live RTSP streaming
- 💡 **Device Control** - Control lights, thermostats, locks, fans, blinds, and more
- 🔄 **Automations** - Create and manage automation rules
- ⭐ **Easy Camera Setup** - Add cameras through UI - no .env file editing needed!
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean interface with smooth animations

## Device Types Supported

- **Lights** - On/off, brightness, color control
- **Thermostats** - Temperature, mode, humidity
- **Locks** - Lock/unlock status
- **Sensors** - Temperature, humidity, etc.
- **Blinds** - Position control (0-100%)
- **Fans** - On/off, speed control
- **Media Players** - Play/pause, volume, source

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your Project URL, anon/public key, and service role key
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Update `.env.local` with your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```
   - Apply the schema and auth structure with Supabase CLI:
     ```bash
     supabase login
     supabase link --project-ref your-project-ref
     supabase db push
     ```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment (Zima OS)

This application is fully containerized and ready for deployment on Zima OS or any Docker-compatible system.

### Quick Start with Docker

1. Copy the Docker environment template:
   ```bash
   cp .env.docker .env
   ```

2. Edit `.env` with your Supabase credentials

3. Build and run:
   ```bash
   docker-compose up -d
   ```

4. Access the application at `http://localhost:3000`

### Services

- **xmarte-web** (Port 3000): Main web application
- **xmarte-relay** (Port 9997 + 9001-9100): RTSP to WebSocket relay for camera streams

For detailed Docker configuration, see [Docker Documentation](./docs/DOCKER.md).

## Camera Notes (C120 / C403 Solar)

- `C120`: should work with RTSP using camera **Device Account** credentials.
- `C403 Solar`: as a battery/solar model, RTSP may not be available. If RTSP is not exposed by firmware, this project cannot stream it with the current RTSP relay architecture.
- In Tapo app, enable third-party support: `Me -> Tapo Lab -> Third-Party Compatibility -> On`.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── devices/       # Device API endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard page
│   └── page.module.css    # Page styles
├── components/            # React components
│   ├── AutomationCard/    # Automation rule card
│   ├── DeviceCard/        # Device control card
│   ├── RoomCard/          # Room container card
│   └── Sidebar/           # Navigation sidebar
├── data/                  # Static data
│   └── devices.ts         # Sample device data
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
├── store/                 # State management
│   └── deviceStore.ts     # Zustand store
└── types/                 # TypeScript types
    └── device.ts          # Device type definitions
```

## API Endpoints

### Devices

- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create a new device
- `GET /api/devices/[id]` - Get a specific device
- `PUT /api/devices/[id]` - Update a device
- `PATCH /api/devices/[id]` - Update device state
- `DELETE /api/devices/[id]` - Delete a device

## Customization

### Adding New Devices

Edit `src/store/deviceStore.ts` to add sample devices, or use the API to create new devices programmatically.

### Adding New Rooms

Update the `initialRooms` array in `src/store/deviceStore.ts`:

```typescript
{ id: 'new-room', name: 'New Room', icon: 'icon-name', devices: [] }
```

### Styling

The application uses CSS custom properties for theming. Edit `src/app/globals.css` to customize colors:

```css
:root {
  --primary: #3b82f6;
  --background: #0f172a;
  --surface: #1e293b;
  /* ... */
}
```

## Future Enhancements

- [ ] Real device integration (MQTT, Zigbee, etc.)
- [x] User authentication
- [ ] Scene management
- [ ] Energy monitoring
- [ ] Mobile app (React Native)
- [ ] Voice control integration
- [ ] Historical data and charts

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Supabase** - Backend as a Service (database, authentication, real-time)
- **Lucide React** - Icons
- **CSS Modules** - Scoped styling

## License

MIT License - Feel free to use and modify for your own smart home setup!
