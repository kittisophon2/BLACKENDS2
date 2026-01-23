const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ดึงหมวดหมู่ทั้งหมด
exports.get = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ดึงหมวดหมู่ตาม ID พร้อมสินค้าในหมวดนั้น
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { category_id: id },
      include: {
        // ดึงความสัมพันธ์สินค้ามาด้วย
        products: {
          include: {
            product: true // ดึงข้อมูล Product ตัวจริงออกมา
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // จัดรูปแบบข้อมูล (เพิ่ม URL รูปภาพให้กับสินค้าในหมวด)
    const categoryWithImages = {
        ...category,
        products: category.products.map(item => {
            // ป้องกันกรณีสินค้าถูกลบไปแล้วแต่ Relation ยังอยู่
            if (!item.product) return item; 

            return {
                ...item,
                product: {
                    ...item.product,
                    product_image: item.product.product_image 
                        ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
                        : null
                }
            };
        })
    };

    res.json(categoryWithImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// เพิ่มหมวดหมู่
exports.create = async (req, res) => {
  try {
    // รองรับการเพิ่มทีละหลายรายการ (Array)
    if (Array.isArray(req.body)) {
      const count = await prisma.category.createMany({
        data: req.body.map(cat => ({ name: cat.name })), // map เพื่อความชัวร์
      });
      return res.status(201).json({ message: `${count.count} categories created successfully` });
    } else {
      // เพิ่มรายการเดียว
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await prisma.category.create({ 
        data: { name } 
      });
      res.status(201).json(category);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// แก้ไขหมวดหมู่
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) return res.status(400).json({ error: "Name is required" });

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

// ลบหมวดหมู่
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. ลบความสัมพันธ์สินค้าในหมวดหมู่นี้ก่อน (ในตาราง ProductCategory)
    // เพื่อป้องกันข้อมูลขยะค้างในระบบ
    await prisma.productCategory.deleteMany({
      where: { category_id: id }
    });

    // 2. ลบตัวหมวดหมู่จริง
    const category = await prisma.category.delete({
      where: { category_id: id },
    });
    
    res.json({ message: "Category deleted successfully", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};