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

// Fetch category by ID
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { category_id: id },
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Create category (แก้ไขแล้ว: ลบ skipDuplicates ออก)
exports.create = async (req, res) => {
  try {
    // กรณีที่ 1: ส่งมาเป็น Array (เพิ่มทีละหลายตัว)
    if (Array.isArray(req.body)) {
      const count = await prisma.category.createMany({
        data: req.body,
        // skipDuplicates: true  <-- ลบออกเพราะ MongoDB ไม่รองรับ
      });
      return res.status(201).json({ message: `${count.count} categories created successfully` });
    } 
    
    // กรณีที่ 2: ส่งมาเป็น Object ธรรมดา (เพิ่มทีละตัว)
    else {
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