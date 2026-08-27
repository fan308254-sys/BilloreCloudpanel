# BilloreCloud Panel V1

MVP starter for a Minecraft hosting panel.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Agent: Go
- Local infrastructure: Docker Compose (PostgreSQL + Redis)

## Quick start

### Infrastructure
```bash
docker compose up -d
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Agent
```bash
cd agent
go run .
```

Frontend: http://localhost:5173
Backend: http://localhost:3000
Agent: http://localhost:8080/health

This V1 is a starter and does not yet create real Minecraft containers. Docker orchestration should be added through an authenticated agent in a later phase.
