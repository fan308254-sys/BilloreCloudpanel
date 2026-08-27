import { useEffect, useState } from "react";
import { api } from "./lib/api";

type Server = {
  id: string;
  name: string;
  status: string;
  memory: number;
  disk: number;
  cpu: number;
};

export default function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    api("/api/health")
      .then(() => setApiStatus("Online"))
      .catch(() => setApiStatus("Offline"));

    api("/api/servers")
      .then((data) => setServers(data.servers ?? []))
      .catch(() => setServers([]));
  }, []);

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
          <span className="badge">API: {apiStatus}</span>
        </header>

        <section className="cards">
          <div className="card"><span>Servers</span><strong>{servers.length}</strong></div>
          <div className="card"><span>Online</span><strong>{servers.filter(s => s.status === "online").length}</strong></div>
          <div className="card"><span>Nodes</span><strong>0</strong></div>
          <div className="card"><span>Plan</span><strong>V1</strong></div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>My Servers</h2>
            <button>Create Server</button>
          </div>

          {servers.length === 0 ? (
            <div className="empty">No servers yet. Your first server will appear here.</div>
          ) : (
            <div className="server-list">
              {servers.map((server) => (
                <div className="server" key={server.id}>
                  <div>
                    <h3>{server.name}</h3>
                    <p>{server.memory} MB RAM · {server.disk} GB Disk · {server.cpu}% CPU</p>
                  </div>
                  <span className={`status ${server.status}`}>{server.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
