const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// 1. ดูตะกร้าของ User คนนั้น (สำคัญมาก! ต้องมีบรรทัดนี้ถึงจะแสดงสินค้าได้)
router.get('/:user_id', cartController.getCart);

// 2. หยิบของใส่ตะกร้า
router.post('/add', cartController.addToCart);

// 3. แก้ไขจำนวน (ส่ง item_id ไป)
router.put('/update/:item_id', cartController.updateCartItem);

// 4. ลบของออกจากตะกร้า
router.delete('/remove/:item_id', cartController.removeCartItem);

module.exports = router;