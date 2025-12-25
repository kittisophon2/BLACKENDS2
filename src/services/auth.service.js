const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET_KEY || 'your_secret_key'; // เก็บ secret key ไว้ใน environment variable 

const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' }); // กำหนดเวลาหมดอายุของ token
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
};


module.exports = { generateToken, verifyToken };
