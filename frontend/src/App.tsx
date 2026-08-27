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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", nodeId: "", memory: "2048", disk: "10", cpu: "100" });

  async function load() {
    setError("");
    try {
      await api("/api/health");
      setApiStatus("Online");
      const [serverData, nodeData] = await Promise.all([api("/api/servers"), api("/api/nodes")]);
      setServers(serverData.servers ?? []);
      setNodes(nodeData.nodes ?? []);
      setForm((old) => ({ ...old, nodeId: old.nodeId || nodeData.nodes?.[0]?.id || "" }));
    } catch (err) {
      setApiStatus("Offline");
      setError(err instanceof Error ? err.message : "Unable to connect to the API");
    }
  }

  useEffect(() => { void load(); }, []);

  async function createServer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const data = await api("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          nodeId: form.nodeId,
          memory: Number(form.memory),
          disk: Number(form.disk),
          cpu: Number(form.cpu),
        }),
      });
      setServers((current) => [data.server, ...current]);
      setShowCreate(false);
      setForm((old) => ({ ...old, name: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server creation failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">BilloreCloud</div>
        <nav>
          <a className="active">Dashboard</a><a>Servers</a><a>Billing</a><a>Support</a><a>Settings</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">CONTROL PANEL</p><h1>Dashboard</h1></div>
          <div className="top-actions"><span className="badge">API: {apiStatus}</span><button onClick={() => void load()}>Refresh</button></div>
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
            <button onClick={() => setShowCreate(true)} disabled={nodes.length === 0}>Create Server</button>
          </div>

          {nodes.length === 0 && <div className="notice">No nodes are registered. Add a node before creating a server.</div>}

          {servers.length === 0 ? (
            <div className="empty"><strong>No servers yet</strong><p>Create your first panel server after adding a node.</p></div>
          ) : (
            <div className="server-list">{servers.map((server) => (
              <div className="server" key={server.id}>
                <div><h3>{server.name}</h3><p>{server.memory} MB RAM · {server.disk} GB Disk · {server.cpu}% CPU</p><small>{server.node?.name ?? "No node"}</small></div>
                <span className={`status ${server.status.toLowerCase()}`}>{server.status}</span>
              </div>
            ))}</div>
          )}
        </section>
      </main>

      {showCreate && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <form className="modal" onSubmit={createServer}>
            <div className="modal-head"><h2>Create Server</h2><button type="button" className="close" onClick={() => setShowCreate(false)}>×</button></div>
            <label>Server Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Survival SMP" /></label>
            <label>Node<select required value={form.nodeId} onChange={(e) => setForm({ ...form, nodeId: e.target.value })}>{nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.status})</option>)}</select></label>
            <div className="form-grid">
              <label>RAM (MB)<input type="number" min="128" required value={form.memory} onChange={(e) => setForm({ ...form, memory: e.target.value })} /></label>
              <label>Disk (GB)<input type="number" min="1" required value={form.disk} onChange={(e) => setForm({ ...form, disk: e.target.value })} /></label>
              <label>CPU (%)<input type="number" min="1" required value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} /></label>
            </div>
            <p className="modal-note">V1 creates the server record in the panel. Minecraft Docker provisioning is the next agent phase.</p>
            <button className="create-button" disabled={creating || !form.nodeId}>{creating ? "Creating..." : "Create Server"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
