const express = require("express");
const app = express.Router();
const controller = require("../controllers/register.controller");

app.get("/", controller.get);

// ✅ ต้องมีบรรทัดนี้เพื่อรองรับ getUser (/:id)
app.get("/:id", controller.getById);

app.post("/", controller.create); // Register
app.post("/login", controller.login); // Login
app.put("/:id", controller.update);
app.delete("/:id", controller.delete);
app.put("/role/:id", controller.updateRole); // Update Role

module.exports = app;