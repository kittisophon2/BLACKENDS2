const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken'); // ต้อง import jwt เพื่อใช้ debug error
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ใช้ Key เดียวกับ auth.service.js
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key'; 

exports.verifyToken = (req, res, next) => {
  try {
    // 1. รับ Header
    const authHeader = req.headers['authorization'] || req.headers['x-access-token'];

    if (!authHeader) {
      console.log("❌ Auth Middleware: No token provided");
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // 2. ตัดคำว่า Bearer ออก (ถ้ามี)
    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      console.log("❌ Auth Middleware: Token format incorrect");
      return res.status(401).json({ error: 'Unauthorized: Token format incorrect' });
    }

    // 3. ตรวจสอบ Token (Verify)
    // ใช้ jwt.verify โดยตรงที่นี่เพื่อจับ Error ได้ชัดเจนกว่าผ่าน authService
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // 4. ผ่าน -> เก็บ userId
    req.userId = decoded.userId;
    next();

  } catch (err) {
    // ⚠️ แสดง Error จริงใน Terminal เพื่อให้รู้ว่าผิดตรงไหน
    console.error("❌ Auth Error:", err.name, err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired. Please login again.' });
    }
    
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      console.log("❌ Auth Middleware: User is not Admin (Role:", user?.role, ")");
      return res.status(403).json({ error: "Require Admin Role!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.isSuperAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId }
    });

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: "Require Super Admin Role!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};