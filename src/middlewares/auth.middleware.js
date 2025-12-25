const authService = require('../services/auth.service');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // ดึง token จาก header

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = decoded; // เก็บข้อมูลผู้ใช้ไว้ใน req.user
  next();
};

module.exports = { authenticate };
