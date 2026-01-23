const express = require('express');
const app = express();
const path = require("path");

// Load Environment Variables
require('dotenv').config();
const port = process.env.PORT || 4000; // ใช้ Port 4000

const bodyParser = require('body-parser');
const cors = require('cors');

// --- 1. Import Routes ---
const productRoute = require('./routes/product.route');
const categoryRoute = require('./routes/category.route'); 
const authRoute = require('./routes/register.route'); 
const reviewRoute = require('./routes/review.route');
const orderRoute = require('./routes/order.route');
const cartRoute = require('./routes/cart.route');

// --- Static Files ---
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/userpictures', express.static(path.join(__dirname, '../userpictures')));
// Frontend Static Files (Optional)
app.use("/html_books", express.static(path.join(__dirname, "../html_books")));

// CORS & Body Parser
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Default Route
app.get("/", (req, res) => {
    res.send("Welcome to IT Shop API running on port " + port);
});

// --- 2. Use Routes ---
app.use("/products", productRoute);

// ✅ แก้ไข: เปลี่ยนกลับมาใช้ "/categories" ให้ตรงกับ Frontend (Category.service.js)
app.use("/categories", categoryRoute);

// ✅ ยืนยัน: ใช้ "/auth" ตรงกับ User.service.js แล้ว
app.use("/auth", authRoute); 

app.use("/reviews", reviewRoute);
app.use("/orders", orderRoute);
app.use("/carts", cartRoute);

// Start Server
app.listen(port, () => {
    console.log("App started at port: " + port);
});