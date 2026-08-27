# BilloreCloud Panel V1

A clean starter for a Minecraft hosting control panel.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Cache: Redis
- Node Agent: Go
- Infrastructure: Docker Compose

## Requirements

Use **Node.js 20 or newer**. Node.js 22 LTS is recommended.

Check:

```bash
node -v
npm -v
go version
docker --version
docker compose version
```

If `node` or `npm` says `command not found` on Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Then verify:

```bash
node -v
npm -v
```

If `go` says `command not found`:

```bash
sudo apt update
sudo apt install -y golang-go
```

Then verify:

```bash
go version
```

## 1. Clone

```bash
git clone https://github.com/fan308254-sys/BilloreCloudpanel.git
cd BilloreCloudpanel
```

## 2. Start PostgreSQL and Redis

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

## 3. Backend

Open terminal 1:

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Backend:

`http://YOUR_VPS_IP:3000`

Health:

`http://YOUR_VPS_IP:3000/api/health`

Database health:

`http://YOUR_VPS_IP:3000/api/health/db`

## 4. Node Agent

Open terminal 2:

```bash
cd agent
go run .
```

Agent health:

`http://YOUR_VPS_IP:8080/health`

## 5. Frontend

Open terminal 3:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend:

`http://YOUR_VPS_IP:5173`

## VPS firewall

If UFW is enabled and you need direct testing from your PC:

```bash
sudo ufw allow 5173/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
```

For production, do **not** expose PostgreSQL (5432) or Redis (6379) publicly. Use Nginx + HTTPS for the web panel/API and keep the database/cache private.

## Troubleshooting

### `zsh: command not found: npm`
Install Node.js 20+ using the commands above, then run `npm -v` again.

### `zsh: command not found: go`
Install Go with `sudo apt install -y golang-go`, then run `go version`.

### `SyntaxError: Unexpected token '.'` while running npm
This usually means the Node.js runtime is too old for the installed npm/tooling. Upgrade to Node.js 20+ and reinstall dependencies:

```bash
node -v
cd backend
rm -rf node_modules
npm install
```

### Prisma/database errors
Make sure PostgreSQL is running:

```bash
docker compose ps
```

Then:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Current V1 scope

The current release provides a working dashboard/API/database/agent foundation and health checks. It **does not yet create or control real Minecraft Docker containers**. That functionality belongs in the next phase and must be implemented through authenticated node-agent operations rather than exposing Docker directly to the browser.
