const express = require('express');
const app = express.Router();
const controller = require('../controllers/register.controller');

// ✅ 1. เพิ่ม isSuperAdmin เข้ามาใน import (เรียกใช้ Middleware ตัวใหม่)
const { verifyToken, isAdmin, isSuperAdmin } = require('../middlewares/auth.middleware');

app.get("/", controller.get);
app.get("/:id", controller.getById);
app.post("/", controller.create);
app.put("/:id", controller.update);
app.delete("/:id", controller.delete);
app.post("/login", controller.login);

// ✅ 2. เปลี่ยนตัวล็อกเป็น isSuperAdmin 
// (เฉพาะเจ้าของร้านเท่านั้นที่มีสิทธิ์เปลี่ยน Role คนอื่น)
app.put("/update-role/:id", [verifyToken, isSuperAdmin], controller.updateRole);

module.exports = app;