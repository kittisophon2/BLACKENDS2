const express = require('express');
const router = express.Router(); // นิยมใช้ชื่อ router แทน app ในไฟล์แยก
const controller = require('../controllers/product.controller'); // เปลี่ยนเป็น product controller
const authMiddleware = require('../middlewares/auth.middleware');

// Define routes

// CRUD พื้นฐาน
router.get("/", controller.get);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

// Search (ต้องระวัง: ตรวจสอบว่าใน product.controller มีฟังก์ชัน searchProducts และรับค่า params ตามนี้จริงหรือไม่)
// ผมเปลี่ยนตัวอย่างเป็นค้นหาด้วย name และ category แทน title และ author
router.get('/search/:name/:category', controller.searchProducts); 

// Top Products (เปลี่ยนจาก Books เป็น Products)
router.get('/top-products/top', controller.getTopProducts); 
router.get('/top-products/toprating', controller.getTopRatingProducts);

// เส้นทางใหม่สำหรับเพิ่มค่า added_to_list_count (เช่น จำนวนคนกด wishlist)
router.put('/increment-added-to-list/:id', authMiddleware.authenticate, controller.incrementAddedToListCount);

// เส้นทางใหม่สำหรับเพิ่มรีวิว
router.post('/add-review', authMiddleware.authenticate, controller.addReview);

module.exports = router;