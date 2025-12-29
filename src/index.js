const express = require('express');
const app = express();
const path = require("path");

// get port number from environment settings
require('dotenv').config();
const port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
const cors = require('cors');

// --- 1. Import Routes ---
const productRoute = require('./routes/product.route'); 
const categoriesRoute = require('./routes/category.route');
const registersRoute = require('./routes/register.route');
const reviewRoute = require('./routes/review.route');
const productCategoryRoute = require('./routes/bookCategory.route'); // ใช้ไฟล์เดิมเชื่อมโยงหมวดหมู่
const orderRoute = require('./routes/order.route');

// --- Static Files ---
app.use('/images', express.static('images'));
app.use('/userpictures', express.static('userpictures'));

// Frontend Static Files
app.use("/html_books", express.static(path.join(__dirname, "../html_books")));

// CORS & Body Parser
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Path URL หลัก
app.get("/", (req, res) => {
    res.send("Welcome to IT Shop API");
});

// --- 2. Use Routes ---
app.use("/products", productRoute); 
app.use("/categories", categoriesRoute);
app.use("/registers", registersRoute);
app.use("/product-categories", productCategoryRoute);
app.use("/reviews", reviewRoute);

app.use("/orders", orderRoute);
app.listen(port, () => {
    console.log("App started at port: " + port);
});