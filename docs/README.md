# xmarte Documentation

Welcome to the xmarte project documentation. This directory contains comprehensive guides and documentation for the project.

## 📚 Available Documentation

### Setup Guides

- **[Quick Start Guide](./QUICK_START.md)** ⚡ - Get up and running in 5 minutes!
- **[Tapo Camera Setup](./TAPO_CAMERA_SETUP.md)** - Complete guide for integrating TP-Link Tapo cameras with live streaming capabilities
- **[Camera Management](./CAMERA_MANAGEMENT.md)** - How to add, update, and manage cameras through the UI (no .env editing needed!)

### Technical Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation for all endpoints
- **[Project Overview](./PROJECT_OVERVIEW.md)** - Architecture, technology stack, and project structure

## 🚀 Quick Start

See the **[Quick Start Guide](./QUICK_START.md)** for detailed setup instructions!

**TL;DR:**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (add your Supabase credentials)
cp .env.local.example .env.local

# 3. Setup database and auth
supabase login
supabase link --project-ref your-project-ref
supabase db push

# 4. Start the app
npm run dev -- -p 4000

# 5. Add cameras at http://localhost:4000/cameras - click "Add Device"!
```

## 🏗️ Project Structure

```
xmarte/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   └── cameras/      # Camera viewing page
│   ├── components/       # React components
│   └── lib/              # Utility libraries
├── server/               # Backend servers
│   └── rtsp-websocket-server.js
├── supabase/            # Supabase schema and migrations
└── docs/                # Documentation (you are here)
```

## 🔧 Technologies

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Node.js, Supabase
- **Streaming:** RTSP, WebSocket, JSMpeg
- **UI:** Tailwind CSS (if configured), Lucide React icons

## 📖 Additional Resources

### Supabase
- Project URL: https://nevdmnluvegwmjmgmjef.supabase.co
- Documentation: https://supabase.com/docs

### Tapo Cameras
- RTSP Documentation: https://www.tp-link.com/us/support/faq/2680/
- Official Support: https://www.tapo.com/us/support/

## 🤝 Contributing

When adding new features or integrations, please:

1. Create corresponding documentation in this folder
2. Update this README with links to new docs
3. Follow the existing documentation structure
4. Include setup instructions, troubleshooting, and examples

## 📝 Documentation Template

When creating new documentation, consider including:

- **Overview** - What the feature does
- **Prerequisites** - Required dependencies/setup
- **Installation** - Step-by-step setup instructions
- **Configuration** - Environment variables and settings
- **Usage** - How to use the feature with examples
- **Troubleshooting** - Common issues and solutions
- **API Reference** - If applicable
- **Resources** - External links and references

## 🔐 Security

- Never commit `.env.local` or credential files
- Keep sensitive documentation (internal APIs, credentials) out of version control
- Review security considerations in feature-specific docs

## 📧 Support

For questions or issues:
1. Check the relevant documentation in this folder
2. Review troubleshooting sections
3. Open an issue in the project repository

---

Last updated: 2026-03-08
