import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { PrismaClient, ServerStatus } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "BilloreCloud API", version: "1.0.2", status: "online" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "BilloreCloud API is running",
    version: "1.0.2",
    uptime: Math.round(process.uptime()),
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, database: "online" });
  } catch {
    res.status(503).json({ success: false, database: "offline", message: "Database connection failed" });
  }
});

app.get("/api/servers", async (_req, res, next) => {
  try {
    const servers = await prisma.server.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        memory: true,
        disk: true,
        cpu: true,
        node: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, servers });
  } catch (error) {
    next(error);
  }
});

app.get("/api/nodes", async (_req, res, next) => {
  try {
    const nodes = await prisma.node.findMany({
      select: { id: true, name: true, host: true, port: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, nodes });
  } catch (error) {
    next(error);
  }
});

// V1 database-level server creation. It creates the panel record; Docker/Minecraft
// provisioning is intentionally handled by the node-agent phase and is not automatic yet.
app.post("/api/servers", async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const nodeId = typeof req.body?.nodeId === "string" ? req.body.nodeId : "";
    const memory = Number(req.body?.memory ?? 2048);
    const disk = Number(req.body?.disk ?? 10);
    const cpu = Number(req.body?.cpu ?? 100);

    if (!name || !nodeId) {
      return res.status(400).json({ success: false, message: "name and nodeId are required" });
    }
    if (![memory, disk, cpu].every(Number.isFinite) || memory < 128 || disk < 1 || cpu < 1) {
      return res.status(400).json({ success: false, message: "Invalid resource values" });
    }

    const node = await prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) return res.status(404).json({ success: false, message: "Node not found" });

    // Development V1 owner. Replace this with authenticated user ID when auth is enabled.
    const owner = await prisma.user.upsert({
      where: { email: "demo@billorecloud.local" },
      update: {},
      create: {
        name: "BilloreCloud Demo",
        email: "demo@billorecloud.local",
        passwordHash: "disabled-demo-account",
      },
    });

    const server = await prisma.server.create({
      data: {
        name,
        ownerId: owner.id,
        nodeId: node.id,
        memory: Math.round(memory),
        disk: Math.round(disk),
        cpu: Math.round(cpu),
        status: ServerStatus.OFFLINE,
      },
      select: {
        id: true,
        name: true,
        status: true,
        memory: true,
        disk: true,
        cpu: true,
        node: { select: { id: true, name: true, status: true } },
      },
    });

    return res.status(201).json({ success: true, server, message: "Server created in panel" });
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`BilloreCloud API running on http://0.0.0.0:${port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
