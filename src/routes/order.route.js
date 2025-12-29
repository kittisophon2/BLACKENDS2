const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');

// Admin: ดูรายการคำสั่งซื้อทั้งหมด
router.get('/', controller.getAllOrders);

// Admin: ดูรายละเอียดเจาะจง
router.get('/:id', controller.getOrderById);

// Admin: เปลี่ยนสถานะ (เช่น กดยืนยันการโอนเงิน, กดส่งของ)
router.put('/:id/status', controller.updateOrderStatus);

module.exports = router;