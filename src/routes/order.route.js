const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');
// const { verifyToken, isAdmin } = require('../middlewares/auth.middleware'); // ถ้ามี middleware ให้เปิดใช้

// --- User Routes ---
router.post('/', controller.createOrder);              // สั่งซื้อ (Checkout)
router.put('/:id/upload-slip', controller.uploadSlip); // แนบสลิป (รับเป็น form-data: Key=slip_image)
router.get('/my-orders/:user_id', controller.getMyOrders); // ดูประวัติการซื้อ

// --- Admin Routes ---
router.get('/', controller.getAllOrders);       // ดูทั้งหมด
router.get('/:id', controller.getOrderById);    // ดูรายตัว
router.put('/:id/status', controller.updateOrderStatus); // เปลี่ยนสถานะ

module.exports = router;