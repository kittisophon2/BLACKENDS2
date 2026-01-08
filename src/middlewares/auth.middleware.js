const authService = require('../services/auth.service');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. ตรวจสอบ Token (เปลี่ยนชื่อเป็น verifyToken เพื่อให้ตรงกับ Route)
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // ดึง token

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // เรียกใช้ Service (แก้ไขปัญหา Key ไม่ตรงกัน)
  const decoded = authService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // กำหนด req.userId เพื่อให้ isAdmin และ Controller อื่นๆ ใช้งานต่อได้
  req.userId = decoded.userId; 
  next();
};

// 2. ตรวจสอบ Admin (เพิ่มกลับเข้ามา)
exports.isAdmin = async (req, res, next) => {
  try {
    // เช็คใน Database ว่า user นี้ role เป็น admin ไหม
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Require Admin Role!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};