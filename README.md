# BilloreCloud Panel V1.1

Minecraft hosting panel MVP with a React dashboard, Node.js API, PostgreSQL/Prisma, and an authenticated Go node agent that provisions Paper Minecraft containers through Docker.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Cache: Redis
- Node Agent: Go
- Minecraft runtime: Docker + `itzg/minecraft-server` (Paper)

## Requirements
Node.js 20+ (22 recommended), Go, Docker and Docker Compose.

## Install / update
```bash
git clone https://github.com/fan308254-sys/BilloreCloudpanel.git
cd BilloreCloudpanel
docker compose up -d
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```
API: `http://YOUR_VPS_IP:3000`

### Node agent (run on the Minecraft VPS)
Set a strong token before starting:
```bash
cd agent
export AGENT_TOKEN='CHANGE_THIS_TO_A_LONG_RANDOM_SECRET'
go run .
```
Agent: `http://YOUR_NODE_IP:8080/health`

The agent needs permission to access Docker. On a normal Linux Docker installation, the user running the agent should be in the `docker` group or run the agent with appropriate service permissions. Never expose the agent port publicly without network controls and a strong token.

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env and set VITE_API_URL to the backend address, NOT the frontend URL.
npm install
npm run dev -- --host 0.0.0.0
```

## Using the panel
1. Open the frontend.
2. Click **Add Node**.
3. Enter the node VPS IP/hostname, agent port (default 8080), and the same `AGENT_TOKEN`.
4. Click **Ping** and confirm the node becomes online.
5. Click **Create Server**.
6. Select the node, RAM, disk, CPU and Minecraft version.
7. The backend asks the authenticated agent to create a persistent Paper container.
8. Use Start/Stop/Restart from the server card.

Minecraft data is stored under `/opt/billorecloud/servers/<server-id>` on the node.

## Important
- The browser never talks directly to Docker.
- The backend communicates with the authenticated agent.
- V1 uses a demo owner account internally; proper user authentication/authorization is a next phase.
- The node token is stored as a database value in this MVP. Encrypt/rotate secrets before production use.
- Disk is represented as a panel resource value in V1; filesystem quota enforcement is not yet implemented.

## Troubleshooting
### `zsh: command not found: npm`
Install Node.js 20+.

### `zsh: command not found: go`
```bash
sudo apt update
sudo apt install -y golang-go
```

### Node is offline
On the node:
```bash
cd agent
export AGENT_TOKEN='same-token-used-in-panel'
go run .
```
Then test:
```bash
curl http://127.0.0.1:8080/health
```

### Docker permission denied
Check:
```bash
docker ps
```
The account running the agent must have Docker access.

### Prisma schema changed
Run:
```bash
cd backend
npx prisma generate
npx prisma db push
```

## Ports
- Frontend: 5173
- Backend: 3000
- Node Agent: 8080
- PostgreSQL: 5432 (keep private)
- Redis: 6379 (keep private)
