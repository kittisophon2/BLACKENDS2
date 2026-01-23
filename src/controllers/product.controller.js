const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Config Multer ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "images/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "product_image", maxCount: 1 },
]);

// Helper
const parseCategories = (categories) => {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  return categories.split(",");
};

// --- Controller Methods ---

exports.get = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        categories: { include: { category: true } },
        reviews: { include: { user: true } },
      },
    });
    const productsWithUrls = products.map((product) => ({
      ...product,
      product_image: product.product_image
        ? `${req.protocol}://${req.get("host")}/images/${product.product_image}`
        : null,
      categories: product.categories.map((cat) => cat.category),
      reviews: product.reviews.map((review) => ({
        ...review,
        user: {
          ...review.user,
          pictureUrl: review.user.picture
            ? `${req.protocol}://${req.get("host")}/userpictures/${review.user.picture}`
            : null,
        },
      })),
    }));
    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { product_id: id },
      include: {
        categories: { include: { category: true } },
        reviews: {
          include: {
            user: { select: { user_id: true, username: true, email: true, picture: true } },
          },
        },
      },
    });

    if (product) {
      const productWithUrl = {
        ...product,
        product_image: product.product_image
          ? `${req.protocol}://${req.get("host")}/images/${product.product_image}`
          : null,
        categories: product.categories.map((cat) => cat.category),
        reviews: product.reviews.map((review) => ({
          ...review,
          user: {
            ...review.user,
            pictureUrl: review.user.picture
              ? `${req.protocol}://${req.get("host")}/userpictures/${review.user.picture}`
              : null,
          },
        })),
      };
      res.json(productWithUrl);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  const { product_name, brand, price } = req.query;
  try {
    const filters = [];
    if (product_name && product_name !== "default") {
      filters.push({ product_name: { contains: product_name, mode: 'insensitive' } });
    }
    if (brand && brand !== "default") {
      filters.push({ brand: { contains: brand, mode: 'insensitive' } });
    }
    if (price && price !== "default") {
      filters.push({ price: { lte: parseFloat(price) } });
    }

    const products = await prisma.product.findMany({
      where: { AND: filters.length > 0 ? filters : undefined },
      orderBy: { product_name: "asc" },
    });

    const productsWithUrls = products.map((product) => ({
      ...product,
      product_image: product.product_image
        ? `${req.protocol}://${req.get("host")}/images/${product.product_image}`
        : null,
    }));
    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { product_name, brand, price, stock, description, specifications, categories } = req.body;
    const product_image = req.files && req.files["product_image"] ? req.files["product_image"][0].filename : null;
    const category_ids = parseCategories(categories);

    try {
      const product = await prisma.product.create({
        data: {
          product_name,
          brand,
          price: parseFloat(price),
          stock: parseInt(stock || 0),
          description,
          specifications,
          product_image,
          categories: {
            create: category_ids.map((id) => ({ category: { connect: { category_id: id } } })),
          },
        },
      });
      res.status(201).json({ message: "Created successfully", _id: product.product_id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.update = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { id } = req.params;
    const { product_name, brand, price, stock, description, specifications, categories } = req.body;
    const product_image = req.files && req.files["product_image"] ? req.files["product_image"][0].filename : undefined;
    const category_ids = parseCategories(categories);

    try {
      const updateData = { product_name, brand, description, specifications };
      if (price) updateData.price = parseFloat(price);
      if (stock) updateData.stock = parseInt(stock);
      if (product_image) updateData.product_image = product_image;

      if (category_ids.length > 0) {
        await prisma.productCategory.deleteMany({ where: { product_id: id } });
        updateData.categories = {
          create: category_ids.map((cid) => ({ category: { connect: { category_id: cid } } })),
        };
      }

      const product = await prisma.product.update({
        where: { product_id: id },
        data: updateData,
      });
      res.json({ message: "Updated", product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    try { await prisma.cartItem.deleteMany({ where: { product_id: id } }); } catch (e) {}
    try { await prisma.orderItem.deleteMany({ where: { product_id: id } }); } catch (e) {}
    try { await prisma.review.deleteMany({ where: { product_id: id } }); } catch (e) {}
    try { await prisma.productCategory.deleteMany({ where: { product_id: id } }); } catch (e) {}

    const product = await prisma.product.findUnique({ where: { product_id: id } });
    if (product && product.product_image) {
      const imagePath = path.join("images", product.product_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.product.delete({ where: { product_id: id } });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message || "Cannot delete product" });
  }
};

// ✅ ฟังก์ชันที่เคยหายไป (ต้องมีฟังก์ชันนี้ ไม่งั้น Error!)
exports.getTopProducts = async (req, res) => {
  const { limit } = req.query;
  try {
    const topProducts = await prisma.product.findMany({
      orderBy: [
        { added_to_list_count: "desc" },
        { review_count: "desc" },
      ],
      take: parseInt(limit) || 10,
    });

    const productsWithUrls = topProducts.map((product) => ({
      ...product,
      product_image: product.product_image
        ? `${req.protocol}://${req.get("host")}/images/${product.product_image}`
        : null,
    }));

    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopRatingProducts = async (req, res) => {
  const { limit } = req.query;
  try {
    const topProducts = await prisma.product.findMany({
      orderBy: [
        { average_rating: "desc" },
        { review_count: "desc" },
      ],
      take: parseInt(limit) || 10,
    });

    const productsWithUrls = topProducts.map((product) => ({
      ...product,
      product_image: product.product_image
        ? `${req.protocol}://${req.get("host")}/images/${product.product_image}`
        : null,
    }));

    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addReview = async (req, res) => {
  const { product_id, user_id, rating, comment } = req.body;
  const ratingInt = parseInt(rating, 10);
  const pId = product_id;
  const uId = user_id;

  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  try {
    const review = await prisma.review.create({
      data: {
        product: { connect: { product_id: pId } },
        user: { connect: { user_id: uId } },
        rating: ratingInt,
        comment,
      },
      include: { user: true },
    });

    await prisma.product.update({
      where: { product_id: pId },
      data: {
        review_count: { increment: 1 },
        average_rating: await calculateAverageRating(pId),
      },
    });

    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function calculateAverageRating(product_id) {
  const reviews = await prisma.review.findMany({
    where: { product_id },
    select: { rating: true },
  });
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const avg = reviews.length > 0 ? totalRating / reviews.length : 0;
  return parseFloat(avg.toFixed(1));
}

exports.incrementAddedToListCount = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.update({
      where: { product_id: id },
      data: { added_to_list_count: { increment: 1 } },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};