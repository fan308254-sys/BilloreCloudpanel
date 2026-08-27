import { useEffect, useState } from "react";
import { api } from "./lib/api";

type Server = { id: string; name: string; status: string; memory: number; disk: number; cpu: number; node?: { id: string; name: string; status: string } };
type Node = { id: string; name: string; status: string };
type Tab = "Dashboard" | "Servers" | "Billing" | "Support" | "Settings";
const tabs: Tab[] = ["Dashboard", "Servers", "Billing", "Support", "Settings"];

export default function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  async function load() {
    setError("");
    try {
      await api("/api/health");
      setApiStatus("Online");
      const [serverData, nodeData] = await Promise.all([api("/api/servers"), api("/api/nodes")]);
      setServers(serverData.servers ?? []);
      setNodes(nodeData.nodes ?? []);
    } catch (err) {
      setApiStatus("Offline");
      setError(err instanceof Error ? err.message : "Unable to connect to the API");
    }
  }

  useEffect(() => { void load(); }, []);
  function selectTab(tab: Tab) { setActiveTab(tab); setMenuOpen(false); }

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">BilloreCloud</div>
        <nav aria-label="Main navigation">
          {tabs.map(tab => <button type="button" key={tab} className={activeTab === tab ? "active" : ""} onClick={() => selectTab(tab)}>{tab}</button>)}
        </nav>
      </aside>
      {menuOpen && <button type="button" className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="title-wrap">
            <button type="button" className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>☰</button>
            <div><p className="eyebrow">CONTROL PANEL</p><h1>{activeTab}</h1></div>
          </div>
          <div className="top-actions"><span className="badge">API: {apiStatus}</span><button type="button" onClick={() => void load()}>Refresh</button></div>
        </header>

        {error && <div className="alert" role="alert">{error}</div>}
        {activeTab === "Dashboard" ? <>
          <section className="cards">
            <div className="card"><span>Servers</span><strong>{servers.length}</strong></div>
            <div className="card"><span>Online</span><strong>{servers.filter(s => ["ONLINE", "online"].includes(s.status)).length}</strong></div>
            <div className="card"><span>Nodes</span><strong>{nodes.length}</strong></div>
            <div className="card"><span>Online Nodes</span><strong>{nodes.filter(n => n.status.toLowerCase() === "online").length}</strong></div>
          </section>
          <section className="panel">
            <div className="panel-title"><h2>My Servers</h2><button type="button" disabled>Create Server</button></div>
            {servers.length === 0 ? <div className="empty"><strong>No servers yet</strong><p>Add a node and create your first Minecraft server in the next V1 phase.</p></div> : <div className="server-list">{servers.map(server => <div className="server" key={server.id}><div><h3>{server.name}</h3><p>{server.memory} MB RAM · {server.disk} GB Disk · {server.cpu}% CPU</p><small>{server.node?.name ?? "No node"}</small></div><span className={`status ${server.status.toLowerCase()}`}>{server.status}</span></div>)}</div>}
          </section>
        </> : <section className="panel placeholder"><h2>{activeTab}</h2><p>This section is prepared for the next BilloreCloud V1 phase.</p></section>}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {tabs.map(tab => <button type="button" key={tab} className={activeTab === tab ? "active" : ""} onClick={() => selectTab(tab)}><span>{tab === "Dashboard" ? "⌂" : tab === "Servers" ? "▣" : tab === "Billing" ? "₹" : tab === "Support" ? "?" : "⚙"}</span><small>{tab}</small></button>)}
      </nav>
    </div>
  );
}
