import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "BilloreCloud API is running", version: "1.0.0" });
});

app.get("/api/servers", async (_req, res) => {
  const servers = await prisma.server.findMany({
    select: { id: true, name: true, status: true, memory: true, disk: true, cpu: true }
  });
  res.json({ servers });
});

app.get("/api/nodes", async (_req, res) => {
  const nodes = await prisma.node.findMany({
    select: { id: true, name: true, host: true, port: true, status: true }
  });
  res.json({ nodes });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`BilloreCloud API running on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
