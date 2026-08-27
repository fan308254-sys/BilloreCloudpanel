import { useEffect, useState } from "react";
import { api } from "./lib/api";

type Server = {
  id: string;
  name: string;
  status: string;
  memory: number;
  disk: number;
  cpu: number;
  node?: { id: string; name: string; status: string };
};

type Node = { id: string; name: string; status: string };

export default function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      await api("/api/health");
      setApiStatus("Online");
      const [serverData, nodeData] = await Promise.all([
        api("/api/servers"),
        api("/api/nodes"),
      ]);
      setServers(serverData.servers ?? []);
      setNodes(nodeData.nodes ?? []);
    } catch (err) {
      setApiStatus("Offline");
      setError(err instanceof Error ? err.message : "Unable to connect to the API");
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">BilloreCloud</div>
        <nav>
          <a className="active">Dashboard</a>
          <a>Servers</a>
          <a>Billing</a>
          <a>Support</a>
          <a>Settings</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">CONTROL PANEL</p>
            <h1>Dashboard</h1>
          </div>
          <div className="top-actions">
            <span className="badge">API: {apiStatus}</span>
            <button onClick={() => void load()}>Refresh</button>
          </div>
        </header>

        {error && <div className="alert">{error}</div>}

        <section className="cards">
          <div className="card"><span>Servers</span><strong>{servers.length}</strong></div>
          <div className="card"><span>Online</span><strong>{servers.filter(s => s.status === "ONLINE").length}</strong></div>
          <div className="card"><span>Nodes</span><strong>{nodes.length}</strong></div>
          <div className="card"><span>Online Nodes</span><strong>{nodes.filter(n => n.status === "online").length}</strong></div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>My Servers</h2>
            <button disabled title="Server creation is coming in the next V1 phase">Create Server</button>
          </div>

          {servers.length === 0 ? (
            <div className="empty">
              <strong>No servers yet</strong>
              <p>Add a node and create your first Minecraft server in the next V1 phase.</p>
            </div>
          ) : (
            <div className="server-list">
              {servers.map((server) => (
                <div className="server" key={server.id}>
                  <div>
                    <h3>{server.name}</h3>
                    <p>{server.memory} MB RAM · {server.disk} GB Disk · {server.cpu}% CPU</p>
                    <small>{server.node?.name ?? "No node"}</small>
                  </div>
                  <span className={`status ${server.status.toLowerCase()}`}>{server.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
