# VitaCare – Your Health, Your Life

Ứng dụng quản lý sức khỏe cá nhân toàn diện.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 52 + TypeScript |
| Navigation | Expo Router v4 |
| State | Zustand + TanStack Query |
| Backend | NestJS + Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + Refresh Token |
| Storage | Supabase Storage |
| Notifications | Expo Notifications |

## Monorepo Structure

```
vitacare/
├── apps/
│   ├── mobile/          # React Native + Expo app
│   └── backend/         # NestJS API server
├── packages/
│   └── shared/          # Shared types and utilities
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- PostgreSQL

### Setup
```bash
# Install all dependencies
pnpm install

# Setup backend environment
cp apps/backend/.env.example apps/backend/.env

# Setup mobile environment
cp apps/mobile/.env.example apps/mobile/.env

# Start backend
pnpm backend

# Start mobile
pnpm mobile
```
