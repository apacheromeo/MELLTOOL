# Thai E-commerce Inventory Management System

A production-grade, scalable inventory management application for Thai e-commerce companies selling vacuum parts (Dyson, Mister Robot, etc.).

## 🏗️ Architecture

- **Frontend**: Next.js 14 (TypeScript, Tailwind CSS, shadcn/ui, next-i18next)
- **Backend**: NestJS (TypeScript) with modular structure
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with role-based access
- **Cache**: Upstash Redis
- **Deployment**: Vercel (Frontend) + Fly.io (Backend)
- **Logging**: Winston + Sentry
- **Barcode**: jsbarcode for Code128
- **Printing**: PDF generation for Aimo D520

## 🚀 Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your credentials
3. Run `npm install` in both `frontend/` and `backend/` directories
4. Set up your database and run migrations
5. Start development servers

## 📁 Project Structure

```
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   ├── common/          # Shared utilities
│   │   └── main.ts
│   ├── prisma/              # Database schema
│   └── Dockerfile
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # Utilities
│   │   └── locales/         # i18n translations
│   └── Dockerfile
├── docs/                    # Documentation
└── docker-compose.yml       # Local development
```

## 🌐 Features

- **Multi-language Support**: English + Thai
- **Shopee Integration**: OAuth2, catalog sync, stock management
- **Inventory Management**: CRUD operations, search, filtering
- **Stock In**: Buy-in tracking with cost management
- **Barcode Generation**: Code128 barcodes with PDF printing
- **Role-based Access**: Owner, Staff, Accountant roles
- **Real-time Sync**: Background jobs for data synchronization

## 📖 Documentation

- [Architecture Guide](./docs/architecture.md)
- [Setup Instructions](./docs/setup.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🔧 Development

See [docs/setup.md](./docs/setup.md) for detailed setup instructions.

## 📄 License

Private - Internal use only
