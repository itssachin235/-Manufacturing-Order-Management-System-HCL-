import { useState, useEffect } from "react";
import { API } from "./config";
import Orders from "./Orders";
import Products from "./Products";
import Inventory from "./Inventory";
import Production from "./Production";
import Employees from "./Employees";

const menuItems = [
  { label: "Dashboard", icon: "📊" },
  { label: "Orders", icon: "🧾" },
  { label: "Products", icon: "📦" },
  { label: "Inventory", icon: "🏭" },
  { label: "Production", icon: "⚙️" },
  { label: "Employees", icon: "👥" }
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    activeProduction: 0
  });

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    async function fetchStats() {
      try {
        const [ordersResponse, productsResponse, productionResponse] = await Promise.all([
          fetch(`${API}/api/orders`),
          fetch(`${API}/api/products`),
          fetch(`${API}/api/production`)
        ]);

        if (!ordersResponse.ok || !productsResponse.ok || !productionResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();
        const productionData = await productionResponse.json();

        setStats({
          totalOrders: ordersData.length,
          totalProducts: productsData.length,
          pendingOrders: ordersData.filter((order) => order.status === "Pending").length,
          activeProduction: productionData.filter((item) => item.status !== "Completed").length
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    }

    fetchStats();
  }, [activePage]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-kicker">Factory Suite</p>
            <h1>MOMS</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActivePage(label)}
              className={`sidebar-item ${activePage === label ? "active" : ""}`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge">
            <span className="dot" /> Live Ops
          </div>
        </div>
      </aside>

      <main className="content-panel">
        <div className="content-header">
          <div>
            <p className="eyebrow">Manufacturing Control Center</p>
            <h2>{activePage}</h2>
          </div>

          <div className="user-pill">
            <span className="avatar">A</span>
            Admin
          </div>
        </div>

        {activePage === "Dashboard" && (
          <div className="dashboard-wrap">
            <div className="stat-grid">
              <div className="stat-card accent-blue">
                <div className="stat-icon">📦</div>
                <div>
                  <p>Total Orders</p>
                  <h3>{stats.totalOrders}</h3>
                </div>
              </div>

              <div className="stat-card accent-purple">
                <div className="stat-icon">🛒</div>
                <div>
                  <p>Products</p>
                  <h3>{stats.totalProducts}</h3>
                </div>
              </div>

              <div className="stat-card accent-gold">
                <div className="stat-icon">⏳</div>
                <div>
                  <p>Pending Orders</p>
                  <h3>{stats.pendingOrders}</h3>
                </div>
              </div>

              <div className="stat-card accent-green">
                <div className="stat-icon">⚙️</div>
                <div>
                  <p>Active Production</p>
                  <h3>{stats.activeProduction}</h3>
                </div>
              </div>
            </div>

            <div className="mini-panel-grid">
              <div className="mini-panel">
                <h3>Operations Summary</h3>
                <ul>
                  <li><span>Schedule Health</span><strong>Excellent</strong></li>
                  <li><span>Inventory Sync</span><strong>Stable</strong></li>
                  <li><span>Dispatch Ratio</span><strong>92%</strong></li>
                </ul>
              </div>

              <div className="mini-panel">
                <h3>Today’s Focus</h3>
                <ul>
                  <li><span>Urgent Orders</span><strong>{stats.pendingOrders}</strong></li>
                  <li><span>Ready Products</span><strong>{stats.totalProducts}</strong></li>
                  <li><span>Work In Progress</span><strong>{stats.activeProduction}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activePage === "Orders" && <Orders />}
        {activePage === "Products" && <Products />}
        {activePage === "Inventory" && <Inventory />}
        {activePage === "Production" && <Production />}
        {activePage === "Employees" && <Employees />}
      </main>
    </div>
  );
}

export default App;