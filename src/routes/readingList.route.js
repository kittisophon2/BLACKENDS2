const express = require('express');
const app = express.Router();
const controller = require('../controllers/readingList.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes
app.get('/', authMiddleware.authenticate, controller.getAll);
app.get('/:user_id', authMiddleware.authenticate, controller.getByUserId);
app.post('/', authMiddleware.authenticate, controller.add);
app.put('/:reading_id', authMiddleware.authenticate, controller.update);
app.delete('/:reading_id', authMiddleware.authenticate, controller.delete);
app.patch("/:reading_id/start", authMiddleware.authenticate, controller.startReading);
app.patch("/:reading_id/finish", authMiddleware.authenticate, controller.finishReading);
app.get('/fastest/readers', controller.findFastestReaders);

// เพิ่ม Route สำหรับค้นหา ReadingList จาก user_id และ book_id
app.get('/find/by-user-and-book', controller.getReadingListByUserAndBook);

module.exports = app;