 import { useState, useEffect } from "react";
import { API } from "./config";

const API_URL = `${API}/api/production`;

function Production() {
  const [productionOrders, setProductionOrders] = useState([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);

  async function fetchProduction() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch production orders");
      }

      const data = await response.json();
      setProductionOrders(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load production orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProduction();
  }, []);

  async function addProduction() {
    if (!productName.trim() || quantity === "") {
      alert("Please fill all fields");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          quantity: qty,
          status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Production creation failed");
      }

      await fetchProduction();

      setProductName("");
      setQuantity("");
      setStatus("Pending");

      alert("Production order created successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to create production order");
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update failed");
      }

      await fetchProduction();

      // Orders page ko batao ki refresh kare
      window.dispatchEvent(new Event("ordersUpdated"));

      alert(
        `Status updated to "${newStatus}". ${data.updatedOrders ?? 0} matching order(s) updated.`
      );
    } catch (error) {
      console.error("Update Status Error:", error);
      alert(error.message || "Unable to update status");
    }
  }

  async function deleteProduction(id) {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await fetchProduction();
      alert("Production order deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Unable to delete production order");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Production Management</h2>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-5">Create Production Order</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Product Name"
            className="border p-3 rounded-lg w-full"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <input
            type="number"
            min="1"
            placeholder="Production Quantity"
            className="border p-3 rounded-lg w-full"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={addProduction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mt-5"
        >
          + Create Production
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Production Orders</h3>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Product</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : productionOrders.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No production orders available.
                </td>
              </tr>
            ) : (
              productionOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-3">{order.product_name}</td>
                  <td className="p-3">{order.quantity}</td>

                  <td className="p-3">
                    <select
                      className="border p-2 rounded-lg"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => deleteProduction(order.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Production;