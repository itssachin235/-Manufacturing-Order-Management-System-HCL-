import { useState, useEffect, useCallback } from "react";
import { API } from "./config";

const API_URL = `${API}/api/orders`;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      alert("Unable to load orders. Check backend server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Browser tab par wapas aane par refresh
  useEffect(() => {
    window.addEventListener("focus", fetchOrders);
    return () => window.removeEventListener("focus", fetchOrders);
  }, [fetchOrders]);

  // Production se order update hone par refresh
  useEffect(() => {
    window.addEventListener("ordersUpdated", fetchOrders);
    return () => window.removeEventListener("ordersUpdated", fetchOrders);
  }, [fetchOrders]);

  async function addOrder() {
    if (
      !product.trim() ||
      !customer.trim() ||
      quantity === "" ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      alert("Please enter valid order details");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.trim(),
          customer: customer.trim(),
          quantity: Number(quantity),
          status: "Pending"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add order");
      }

      setProduct("");
      setCustomer("");
      setQuantity("");

      await fetchOrders();
    } catch (error) {
      console.error("Add Order Error:", error);
      alert(error.message || "Order could not be added");
    }
  }

  async function deleteOrder(id) {
    if (!window.confirm("Delete this order?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      await fetchOrders();
    } catch (error) {
      console.error("Delete Order Error:", error);
      alert("Order could not be deleted");
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Orders Management</h1>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Order</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border p-3 rounded-lg"
            placeholder="Product Name"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />

          <input
            className="border p-3 rounded-lg"
            placeholder="Customer Name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />

          <input
            className="border p-3 rounded-lg"
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <button
          onClick={addOrder}
          className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          + Add Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">All Orders</h2>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Orders"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Product</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-3">{order.product}</td>
                    <td className="p-3">{order.customer}</td>
                    <td className="p-3">{order.quantity}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
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
    </div>
  );
}

export default Orders;