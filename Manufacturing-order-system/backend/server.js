require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const isBlank = (v) => typeof v !== "string" || v.trim() === "";
const isNonNegNumber = (v) => v !== "" && v !== null && !isNaN(Number(v)) && Number(v) >= 0;
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isNonNegInt = (v) => Number.isInteger(Number(v)) && Number(v) >= 0;

function dbError(res, label, err, message) {
  console.error(`${label}:`, err);
  return res.status(500).json({ message });
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

// ================= PRODUCTS =================
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id", (err, results) => {
    if (err) return dbError(res, "Products Fetch Error", err, "Failed to fetch products");
    res.json(results);
  });
});

app.post("/api/products", (req, res) => {
  const { name, price, stock } = req.body;

  if (isBlank(name) || !isNonNegNumber(price) || !isNonNegInt(stock)) {
    return res.status(400).json({ message: "Valid name, price and stock are required" });
  }

  db.query(
    "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
    [name.trim(), Number(price), Number(stock)],
    (err, result) => {
      if (err) return dbError(res, "Product Creation Error", err, "Product creation failed");
      res.status(201).json({
        message: "Product added successfully",
        id: result.insertId,
        name: name.trim(),
        price: Number(price),
        stock: Number(stock)
      });
    }
  );
});

app.put("/api/products/:id", (req, res) => {
  const { stock } = req.body;

  if (!isNonNegInt(stock)) {
    return res.status(400).json({ message: "Stock must be a whole number >= 0" });
  }

  db.query(
    "UPDATE products SET stock = ? WHERE id = ?",
    [Number(stock), req.params.id],
    (err, result) => {
      if (err) return dbError(res, "Product Update Error", err, "Product update failed");
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product stock updated successfully" });
    }
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return dbError(res, "Product Delete Error", err, "Product deletion failed");
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// ================= ORDERS =================
app.get("/api/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY id DESC", (err, results) => {
    if (err) return dbError(res, "Orders Fetch Error", err, "Failed to fetch orders");
    res.json(results);
  });
});

app.post("/api/orders", (req, res) => {
  const { product, customer, quantity, status } = req.body;
  const allowed = ["Pending", "In Progress", "Completed"];
  const orderStatus = allowed.includes(status) ? status : "Pending";

  if (isBlank(product) || isBlank(customer) || !isPositiveInt(quantity)) {
    return res.status(400).json({ message: "Valid product, customer and quantity are required" });
  }

  db.query(
    "INSERT INTO orders (product, customer, quantity, status) VALUES (?, ?, ?, ?)",
    [product.trim(), customer.trim(), Number(quantity), orderStatus],
    (err, result) => {
      if (err) return dbError(res, "Order Creation Error", err, "Order creation failed");
      res.status(201).json({
        message: "Order added successfully",
        id: result.insertId,
        product: product.trim(),
        customer: customer.trim(),
        quantity: Number(quantity),
        status: orderStatus
      });
    }
  );
});

app.delete("/api/orders/:id", (req, res) => {
  db.query("DELETE FROM orders WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return dbError(res, "Order Delete Error", err, "Order deletion failed");
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order deleted successfully" });
  });
});

// ================= PRODUCTION =================
app.get("/api/production", (req, res) => {
  db.query("SELECT * FROM production ORDER BY id DESC", (err, results) => {
    if (err) return dbError(res, "Production Fetch Error", err, "Failed to fetch production");
    res.json(results);
  });
});

app.post("/api/production", (req, res) => {
  const { productName, quantity, status } = req.body;
  const allowed = ["Pending", "In Progress", "Completed"];
  const productionStatus = allowed.includes(status) ? status : "Pending";

  if (isBlank(productName) || !isPositiveInt(quantity)) {
    return res.status(400).json({ message: "Valid product name and quantity are required" });
  }

  db.query(
    "INSERT INTO production (product_name, quantity, status) VALUES (?, ?, ?)",
    [productName.trim(), Number(quantity), productionStatus],
    (err, result) => {
      if (err) return dbError(res, "Production Creation Error", err, "Production creation failed");
      res.status(201).json({
        message: "Production added successfully",
        id: result.insertId,
        productName: productName.trim(),
        quantity: Number(quantity),
        status: productionStatus
      });
    }
  );
});

// Production status update + matching orders update
app.put("/api/production/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["Pending", "In Progress", "Completed"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid production status" });
  }

  db.query("SELECT product_name FROM production WHERE id = ?", [id], (err, rows) => {
    if (err) return dbError(res, "Production Fetch Error", err, "Production fetch failed");
    if (rows.length === 0) {
      return res.status(404).json({ message: "Production not found" });
    }

    const productName = rows[0].product_name.trim();

    db.query("UPDATE production SET status = ? WHERE id = ?", [status, id], (updateErr) => {
      if (updateErr) return dbError(res, "Production Update Error", updateErr, "Production update failed");

      // Sirf wahi orders update honge jo abhi Completed nahi hain
      db.query(
        `UPDATE orders
         SET status = ?
         WHERE LOWER(TRIM(product)) = LOWER(TRIM(?))
           AND status <> 'Completed'`,
        [status, productName],
        (orderErr, orderResult) => {
          if (orderErr) return dbError(res, "Order Update Error", orderErr, "Order update failed");
          res.json({
            message: "Production and Orders updated successfully",
            productName,
            status,
            updatedOrders: orderResult.affectedRows
          });
        }
      );
    });
  });
});

app.delete("/api/production/:id", (req, res) => {
  db.query("DELETE FROM production WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return dbError(res, "Production Delete Error", err, "Production deletion failed");
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Production not found" });
    }
    res.json({ message: "Production deleted successfully" });
  });
});

// ================= EMPLOYEES =================
app.get("/api/employees", (req, res) => {
  db.query("SELECT * FROM employees ORDER BY id", (err, results) => {
    if (err) return dbError(res, "Employees Fetch Error", err, "Failed to fetch employees");
    res.json(results);
  });
});

app.post("/api/employees", (req, res) => {
  const { name, email, role } = req.body;

  if (isBlank(name) || isBlank(email) || isBlank(role)) {
    return res.status(400).json({ message: "Name, email and role are required" });
  }

  db.query(
    "INSERT INTO employees (name, email, role) VALUES (?, ?, ?)",
    [name.trim(), email.trim(), role.trim()],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already exists" });
        }
        return dbError(res, "Employee Creation Error", err, "Employee creation failed");
      }
      res.status(201).json({
        message: "Employee added successfully",
        id: result.insertId,
        name: name.trim(),
        email: email.trim(),
        role: role.trim()
      });
    }
  );
});

app.delete("/api/employees/:id", (req, res) => {
  db.query("DELETE FROM employees WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return dbError(res, "Employee Delete Error", err, "Employee deletion failed");
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});// Production status update + matching Orders update
app.put("/api/production/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["Pending", "In Progress", "Completed"];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: "Invalid production status"
    });
  }

  db.query(
    "SELECT product_name FROM production WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        return dbError(res, "Production Fetch Error", err,
          "Production fetch failed");
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Production not found"
        });
      }

      const productName = rows[0].product_name.trim();

      db.query(
        "UPDATE production SET status = ? WHERE id = ?",
        [status, id],
        (updateErr) => {
          if (updateErr) {
            return dbError(res, "Production Update Error",
              updateErr, "Production update failed");
          }

          db.query(
            `UPDATE orders
             SET status = ?
             WHERE LOWER(TRIM(product)) = LOWER(TRIM(?))`,
            [status, productName],
            (orderErr, orderResult) => {
              if (orderErr) {
                return dbError(res, "Order Update Error",
                  orderErr, "Order update failed");
              }

              res.json({
                message: "Production and Orders updated successfully",
                productName,
                status,
                updatedOrders: orderResult.affectedRows
              });
            }
          );
        }
      );
    }
  );
});