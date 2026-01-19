const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Fetch all categories
exports.get = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Fetch category by ID (แก้ไข: ให้ดึงสินค้าที่อยู่ในหมวดหมู่นี้มาด้วย)
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { category_id: id },
      include: {
        products: { // เชื่อมกับตาราง ProductCategory
          include: {
            product: true // เชื่อมต่อไปยังตาราง Product เพื่อเอาข้อมูลสินค้าจริง
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // จัดรูปแบบข้อมูลรูปภาพให้มี URL เต็ม (Optional: ถ้าต้องการ)
    const categoryWithImages = {
        ...category,
        products: category.products.map(item => ({
            ...item,
            product: {
                ...item.product,
                product_image: item.product.product_image 
                    ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
                    : null
            }
        }))
    };

    res.json(categoryWithImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create category
exports.create = async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const count = await prisma.category.createMany({
        data: req.body,
      });
      return res.status(201).json({ message: `${count.count} categories created successfully` });
    } else {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await prisma.category.create({ data: { name } });
      res.json(category);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update category
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const category = await prisma.category.update({
      where: { category_id: id },
      data: { name },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete category
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.delete({
      where: { category_id: id },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};