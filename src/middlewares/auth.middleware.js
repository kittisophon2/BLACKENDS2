const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ฟังก์ชันเดิม (ตรวจสอบว่า Login หรือยัง)
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET || "secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.userId = decoded.userId;
    next();
  });
};

// --- เพิ่มฟังก์ชันนี้ต่อท้าย (ตรวจสอบว่าเป็น Admin ไหม) ---
exports.isAdmin = async (req, res, next) => {
  try {
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