const express = require('express');
const router = express.Router();
const controller = require('../controllers/product.controller');
// เรียกใช้ Middleware สำหรับตรวจสอบสิทธิ์
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// --- 1. เส้นทางสาธารณะ (ใครก็เข้าดูได้) ---
router.get("/", controller.get);
router.get("/:id", controller.getById);

// Search: ใช้แบบ Query Params (เช่น /search?product_name=...&brand=...) จะยืดหยุ่นกว่า
router.get('/search', controller.searchProducts); 

// Top Products
router.get('/top-products/top', controller.getTopProducts); 
router.get('/top-products/toprating', controller.getTopRatingProducts);

// --- 2. เส้นทางสำหรับ User ทั่วไป (ต้อง Login) ---
// เพิ่มสินค้าลง Wishlist / Favorite
router.put('/increment-added-to-list/:id', verifyToken, controller.incrementAddedToListCount);

// เพิ่มรีวิว (User ต้อง Login ถึงจะรีวิวได้)
router.post('/add-review', verifyToken, controller.addReview);

// --- 3. เส้นทางสำหรับ Admin เท่านั้น (ต้อง Login + เป็น Admin) ---
// เพิ่มสินค้า
router.post("/", [verifyToken, isAdmin], controller.create);

// แก้ไขสินค้า
router.put("/:id", [verifyToken, isAdmin], controller.update);

// ลบสินค้า
router.delete("/:id", [verifyToken, isAdmin], controller.delete);

module.exports = router;