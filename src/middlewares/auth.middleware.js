const authService = require('../services/auth.service');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. ตรวจสอบ Token (เหมือนเดิม)
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const decoded = authService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.userId = decoded.userId; 
  next();
};

// 2. ตรวจสอบ Admin (อัปเดต: ให้ SuperAdmin ผ่านได้ด้วย)
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId }
    });

    // อนุญาตถ้าเป็น 'admin' หรือ 'superadmin'
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ error: "Require Admin Role!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. ตรวจสอบ Super Admin (เพิ่มใหม่: เฉพาะเจ้าของร้านเท่านั้น)
exports.isSuperAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId }
    });

    // ต้องเป็น 'superadmin' เท่านั้น
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: "Require Super Admin Role!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};