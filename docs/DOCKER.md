# Docker Deployment Guide - XMarte Home Automation

This guide explains how to deploy XMarte using Docker and Docker Compose, specifically optimized for Zima OS.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Zima OS (or any Docker-compatible system)
- Supabase account and project credentials

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd xmarte

# Copy environment template
cp .env.local.example .env.local

# Edit environment variables
nano .env.local
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keepalive Secret (for cron jobs)
KEEPALIVE_SECRET=your-random-secret

# Optional: Custom FFmpeg path (usually not needed in Docker)
# FFMPEG_PATH=ffmpeg
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services Architecture

The Docker Compose setup includes two services:

### xmarte-web (Next.js Application)
- **Port**: 3000
- **Purpose**: Main web interface and API
- **Health Check**: `GET /api/health`

### xmarte-relay (RTSP WebSocket Relay)
- **HTTP API Port**: 9997
- **WebSocket Ports**: 9001-9100 (one per camera stream)
- **Purpose**: Converts RTSP camera feeds to WebSocket streams for JSMpeg
- **Health Check**: `GET /health`

## Zima OS Integration

### Option 1: Direct Docker Compose

1. Copy the project to your Zima OS storage
2. Configure environment variables
3. Run `docker-compose up -d`

### Option 2: Zima OS App Store (CasaOS)

To add XMarte as a CasaOS app:

1. Open CasaOS dashboard
2. Go to "App Store" > "Custom Install"
3. Paste the docker-compose.yml content
4. Configure environment variables
5. Install

### Option 3: Pre-built Images (Recommended for Production)

```yaml
version: '3.8'

services:
  xmarte-web:
    image: ghcr.io/your-username/xmarte-web:latest
    container_name: xmarte-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - KEEPALIVE_SECRET=${KEEPALIVE_SECRET}
      - RELAY_SERVER_URL=http://xmarte-relay:9997
    networks:
      - xmarte-network
    depends_on:
      - xmarte-relay

  xmarte-relay:
    image: ghcr.io/your-username/xmarte-relay:latest
    container_name: xmarte-relay
    restart: unless-stopped
    ports:
      - "9997:9997"
      - "9001-9100:9001-9100"
    environment:
      - NODE_ENV=production
      - HTTP_PORT=9997
      - WS_PORT_START=9001
      - FFMPEG_PATH=ffmpeg
    networks:
      - xmarte-network

networks:
  xmarte-network:
    driver: bridge
```

## Network Configuration

### Internal Communication
- Services communicate via the `xmarte-network` bridge network
- Web app reaches relay at `http://xmarte-relay:9997`

### External Access
- Web Interface: `http://your-zima-ip:3000`
- Relay API: `http://your-zima-ip:9997`
- WebSocket Streams: `ws://your-zima-ip:9001-9100`

### Reverse Proxy Setup (Optional)

For production with SSL/TLS, use a reverse proxy:

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name xmarte.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support for camera streams
    location ~ ^/ws/(\d+)$ {
        proxy_pass http://localhost:$1;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Camera Configuration

When adding cameras in the XMarte interface:

1. Use the camera's RTSP URL (e.g., `rtsp://username:password@camera-ip:554/stream1`)
2. The relay server will automatically assign a WebSocket port
3. Streams are accessible via WebSocket at `ws://your-zima-ip:PORT`

## Health Monitoring

Both services include health checks:

```bash
# Check web app health
curl http://localhost:3000/api/health

# Check relay server health
curl http://localhost:9997/health
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs xmarte-web
docker-compose logs xmarte-relay

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Camera streams not working
1. Verify FFmpeg is installed in relay container: `docker exec xmarte-relay which ffmpeg`
2. Check relay server logs: `docker logs xmarte-relay`
3. Verify RTSP URL is accessible from the container

### Environment variables not loading
1. Ensure `.env` file is in the same directory as `docker-compose.yml`
2. Restart containers: `docker-compose down && docker-compose up -d`

## Resource Requirements

### Minimum
- CPU: 2 cores
- RAM: 2GB
- Storage: 1GB

### Recommended (with multiple cameras)
- CPU: 4 cores
- RAM: 4GB
- Storage: 2GB

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for `KEEPALIVE_SECRET`
3. **Restrict network access** to WebSocket ports (9001-9100) if not needed externally
4. **Use HTTPS** in production via reverse proxy
5. **Keep Supabase keys secure** and use Row Level Security (RLS)

## Backup and Updates

### Backup
```bash
# Export environment variables
cp .env .env.backup

# Backup any persistent data (if using volumes)
docker run --rm -v xmarte-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

### Updates
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Support

For issues and feature requests, please open an issue on the GitHub repository.
