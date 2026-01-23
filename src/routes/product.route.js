const express = require('express');
const router = express.Router();
const controller = require('../controllers/product.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// --- 1. เส้นทางสาธารณะ (Public) ---

// ✅ 1.1 Search & Top Products (ต้องประกาศ "ก่อน" /:id เสมอ)
router.get('/search', controller.searchProducts); 
router.get('/top-products/top', controller.getTopProducts); 
router.get('/top-products/toprating', controller.getTopRatingProducts);

// ✅ 1.2 Get All
router.get("/", controller.get);

// ✅ 1.3 Get By ID (ต้องอยู่ล่างสุดของกลุ่ม GET เพื่อไม่ให้แย่ง Path อื่น)
router.get("/:id", controller.getById);

// --- 2. เส้นทางสำหรับ User (Login Required) ---
router.put('/increment-added-to-list/:id', verifyToken, controller.incrementAddedToListCount);
router.post('/add-review', verifyToken, controller.addReview);

// --- 3. เส้นทางสำหรับ Admin (Admin Required) ---
router.post("/", [verifyToken, isAdmin], controller.create);
router.put("/:id", [verifyToken, isAdmin], controller.update);
router.delete("/:id", [verifyToken, isAdmin], controller.delete);

module.exports = router;