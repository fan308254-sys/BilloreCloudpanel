import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "BilloreCloud API", version: "1.0.1", status: "online" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "BilloreCloud API is running",
    version: "1.0.1",
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
