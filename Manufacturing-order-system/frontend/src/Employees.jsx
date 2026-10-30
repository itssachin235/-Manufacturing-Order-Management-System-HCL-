 import { useState, useEffect } from "react";
import { API } from "./config";

const API_URL = `${API}/api/employees`;

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchEmployees() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load employees. Check backend server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function addEmployee() {
    if (!name.trim() || !email.trim() || !role.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: role.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add employee");
      }

      setEmployees((prev) => [...prev, data]);
      setName("");
      setEmail("");
      setRole("");
    } catch (error) {
      console.error(error);
      alert(error.message || "Employee could not be added");
    }
  }

  async function deleteEmployee(id) {
    if (!window.confirm("Delete this employee?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      setEmployees((prev) => prev.filter((employee) => employee.id !== id));
    } catch (error) {
      console.error(error);
      alert("Employee could not be deleted");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Employees Management</h2>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-bold mb-4">Add New Employee</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Employee Name"
            className="border p-3 rounded-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email Address"
            className="border p-3 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Employee Role"
            className="border p-3 rounded-lg"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <button
          onClick={addEmployee}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-5 hover:bg-blue-700"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No employees added yet.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="border-b">
                  <td className="p-3">{employee.name}</td>
                  <td className="p-3">{employee.email}</td>
                  <td className="p-3">{employee.role}</td>

                  <td className="p-3">
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
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

export default Employees;