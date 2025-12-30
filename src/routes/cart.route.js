const express = require('express');
const router = express.Router();
const controller = require('../controllers/cart.controller');

// ดูตะกร้าของ User คนนั้น
router.get('/:user_id', controller.getCart);

// หยิบของใส่ตะกร้า
router.post('/add', controller.addToCart);

// แก้ไขจำนวน (ส่ง item_id ไป)
router.put('/update/:item_id', controller.updateCartItem);

// ลบของออกจากตะกร้า
router.delete('/remove/:item_id', controller.removeCartItem);

module.exports = router;