 import { useState, useEffect } from "react";
import { API } from "./config";

const API_URL = `${API}/api/products`;

function Inventory() {
  const [products, setProducts] = useState([]);
  const [stockInputs, setStockInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to fetch products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Unable to load products. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateStock = async (id) => {
    const inputValue = stockInputs[id];

    if (inputValue === undefined || String(inputValue).trim() === "") {
      alert("Please enter stock quantity");
      return;
    }

    const quantity = Number(inputValue);

    if (!Number.isInteger(quantity) || quantity < 0) {
      alert("Enter a valid stock quantity");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: quantity })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Stock update failed");
      }

      alert("Stock updated successfully!");

      setStockInputs((prev) => ({ ...prev, [id]: "" }));

      await fetchProducts();
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.message || "Stock could not be updated");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Inventory Management</h2>

      <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Product Name</th>
              <th className="p-3">Available Stock</th>
              <th className="p-3">Update Stock</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  Loading inventory...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No products found. Add products first.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="p-3">{product.name}</td>

                  <td className="p-3 font-semibold">{product.stock}</td>

                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="New stock"
                      className="border p-2 rounded-lg w-32"
                      value={stockInputs[product.id] ?? ""}
                      onChange={(e) =>
                        setStockInputs((prev) => ({
                          ...prev,
                          [product.id]: e.target.value
                        }))
                      }
                    />
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => updateStock(product.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Update
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

export default Inventory;