import { useEffect, useState, type FormEvent } from "react";
import { api } from "./lib/api";

type Server = {
  id: string;
  name: string;
  status: string;
  memory: number;
  disk: number;
  cpu: number;
  version?: string;
  node?: { id: string; name: string; status: string };
  allocation?: { ip: string; port: number };
};

type Node = {
  id: string;
  name: string;
  host?: string;
  port?: number;
  status: string;
};

export default function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showNode, setShowNode] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    nodeId: "",
    memory: "2048",
    disk: "10",
    cpu: "100",
    version: "LATEST",
  });

  const [nodeForm, setNodeForm] = useState({
    name: "",
    host: "",
    port: "8080",
    token: "",
  });

  async function load() {
    setError("");
    try {
      await api("/api/health");
      setApiStatus("Online");

      const [serverData, nodeData] = await Promise.all([
        api("/api/servers"),
        api("/api/nodes"),
      ]);

      const nextServers: Server[] = serverData.servers ?? [];
      const nextNodes: Node[] = nodeData.nodes ?? [];

      setServers(nextServers);
      setNodes(nextNodes);
      setForm((current) => ({
        ...current,
        nodeId: current.nodeId || nextNodes[0]?.id || "",
      }));
    } catch (err) {
      setApiStatus("Offline");
      setError(err instanceof Error ? err.message : "Unable to connect to API");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api("/api/nodes", {
        method: "POST",
        body: JSON.stringify({
          name: nodeForm.name.trim(),
          host: nodeForm.host.trim(),
          port: Number(nodeForm.port),
          token: nodeForm.token,
        }),
      });

      setShowNode(false);
      setNodeForm({ name: "", host: "", port: "8080", token: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Node creation failed");
    } finally {
      setBusy(false);
    }
  }

  async function pingNode(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/nodes/${id}/ping`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Node ping failed");
    } finally {
      setBusy(false);
    }
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const data = await api("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          nodeId: form.nodeId,
          memory: Number(form.memory),
          disk: Number(form.disk),
          cpu: Number(form.cpu),
          version: form.version.trim() || "LATEST",
        }),
      });

      setServers((current) => [data.server, ...current]);
      setShowCreate(false);
      setForm((current) => ({ ...current, name: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server creation failed");
    } finally {
      setBusy(false);
    }
  }

  async function serverAction(id: string, action: "start" | "stop" | "restart") {
    setBusy(true);
    setError("");
    try {
      await api(`/api/servers/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">BilloreCloud</div>
        <nav>
          <button type="button" className="active">Dashboard</button>
          <button type="button">Servers</button>
          <button type="button" onClick={() => setShowNode(true)}>Nodes</button>
          <button type="button">Billing</button>
          <button type="button">Support</button>
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
            <button type="button" onClick={() => void load()}>Refresh</button>
          </div>
        </header>

        {error && <div className="alert">{error}</div>}

        <section className="cards">
          <div className="card"><span>Servers</span><strong>{servers.length}</strong></div>
          <div className="card"><span>Online</span><strong>{servers.filter((s) => s.status === "ONLINE").length}</strong></div>
          <div className="card"><span>Nodes</span><strong>{nodes.length}</strong></div>
          <div className="card"><span>Online Nodes</span><strong>{nodes.filter((n) => n.status.toLowerCase() === "online").length}</strong></div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Nodes</h2>
            <button type="button" onClick={() => setShowNode(true)}>Add Node</button>
          </div>

          {nodes.length === 0 ? (
            <div className="empty">
              <strong>No nodes registered</strong>
              <p>Add your Minecraft VPS as a node first.</p>
            </div>
          ) : (
            <div className="server-list">
              {nodes.map((node) => (
                <div className="server" key={node.id}>
                  <div>
                    <h3>{node.name}</h3>
                    <p>{node.host}:{node.port}</p>
                  </div>
                  <div className="top-actions">
                    <span className={`status ${node.status}`}>{node.status}</span>
                    <button type="button" disabled={busy} onClick={() => void pingNode(node.id)}>Ping</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>My Servers</h2>
            <button type="button" disabled={nodes.length === 0} onClick={() => setShowCreate(true)}>Create Server</button>
          </div>

          {nodes.length === 0 && (
            <div className="notice">Add an online node before creating a Minecraft server.</div>
          )}

          {servers.length === 0 ? (
            <div className="empty">
              <strong>No servers yet</strong>
              <p>Create a Minecraft server after adding a node.</p>
            </div>
          ) : (
            <div className="server-list">
              {servers.map((server) => (
                <div className="server" key={server.id}>
                  <div>
                    <h3>{server.name}</h3>
                    <p>{server.memory} MB RAM · {server.disk} GB Disk · {server.cpu}% CPU · {server.version ?? "LATEST"}</p>
                    <small>
                      {server.node?.name ?? "No node"}
                      {server.allocation ? ` · ${server.allocation.ip}:${server.allocation.port}` : ""}
                    </small>
                  </div>
                  <div className="top-actions">
                    <span className={`status ${server.status.toLowerCase()}`}>{server.status}</span>
                    {server.status !== "ONLINE" && (
                      <button type="button" disabled={busy} onClick={() => void serverAction(server.id, "start")}>Start</button>
                    )}
                    {server.status === "ONLINE" && (
                      <button type="button" disabled={busy} onClick={() => void serverAction(server.id, "stop")}>Stop</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void serverAction(server.id, "restart")}>Restart</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createServer}>
            <div className="modal-head">
              <h2>Create Minecraft Server</h2>
              <button type="button" className="close" onClick={() => setShowCreate(false)}>×</button>
            </div>

            <label>
              Server Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Survival SMP" />
            </label>

            <label>
              Node
              <select required value={form.nodeId} onChange={(e) => setForm({ ...form, nodeId: e.target.value })}>
                <option value="">Select node</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.name} ({node.status})</option>
                ))}
              </select>
            </label>

            <label>
              Minecraft Version
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="LATEST or 1.21.8" />
            </label>

            <div className="form-grid">
              <label>RAM MB<input type="number" min="512" value={form.memory} onChange={(e) => setForm({ ...form, memory: e.target.value })} /></label>
              <label>Disk GB<input type="number" min="1" value={form.disk} onChange={(e) => setForm({ ...form, disk: e.target.value })} /></label>
              <label>CPU %<input type="number" min="1" value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} /></label>
            </div>

            <p className="modal-note">The node agent provisions an isolated Paper Minecraft container.</p>
            <button className="create-button" disabled={busy || !form.nodeId}>
              {busy ? "Creating..." : "Create Server"}
            </button>
          </form>
        </div>
      )}

      {showNode && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addNode}>
            <div className="modal-head">
              <h2>Add Node</h2>
              <button type="button" className="close" onClick={() => setShowNode(false)}>×</button>
            </div>

            <label>
              Node Name
              <input required value={nodeForm.name} onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })} placeholder="VPS Node 1" />
            </label>

            <label>
              Agent Host/IP
              <input required value={nodeForm.host} onChange={(e) => setNodeForm({ ...nodeForm, host: e.target.value })} placeholder="203.0.113.10" />
            </label>

            <label>
              Agent Port
              <input type="number" min="1" max="65535" required value={nodeForm.port} onChange={(e) => setNodeForm({ ...nodeForm, port: e.target.value })} />
            </label>

            <label>
              Agent Token
              <input required type="password" value={nodeForm.token} onChange={(e) => setNodeForm({ ...nodeForm, token: e.target.value })} placeholder="Same as AGENT_TOKEN" />
            </label>

            <p className="modal-note">Run the BilloreCloud agent on the Minecraft VPS and use the same AGENT_TOKEN.</p>
            <button className="create-button" disabled={busy}>{busy ? "Adding..." : "Add Node"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
