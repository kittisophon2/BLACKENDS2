const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const bookCategories = await prisma.bookCategory.findMany({
      include: {
        book: true,
        category: true,
      },
    });
    res.json(bookCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.add = async (req, res) => {
  const { book_id, category_id } = req.body;
  if (!book_id || !category_id) {
    return res.status(400).json({ error: "book_id and category_id are required" });
  }
  try {
    const newBookCategory = await prisma.bookCategory.create({
      data: {
        book_id: book_id.toString(),
        category_id: category_id.toString(),
      },
    });
    res.json(newBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  try {
    const deletedBookCategory = await prisma.bookCategory.delete({
      where: { id: id.toString() },
    });
    res.json(deletedBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByCategoryId = async (req, res) => {
  const { category_id } = req.params;
  if (!category_id) {
    return res.status(400).json({ error: "category_id is required" });
  }

  try {
    const booksInCategory = await prisma.bookCategory.findMany({
      where: {
        category_id: category_id.toString(),
      },
      include: {
        book: true, // รวมข้อมูลหนังสือทั้งหมด
      },
    });

    if (booksInCategory.length === 0) {
      return res.status(404).json({ message: "No books found in this category" });
    }

    // แปลงข้อมูลหนังสือให้มี URL สำหรับภาพและ HTML content
    const booksWithUrls = booksInCategory.map((bookCategory) => {
      const book = bookCategory.book;
      return {
        book_id: book.book_id.toString(),
        title: book.title,
        author: book.author,
        publish_year: book.publish_year,
        description: book.description,
        book_photo: book.book_photo
          ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
          : null,
        summary: book.summary,
        categories: [], // หากต้องการเพิ่มข้อมูล category สามารถปรับได้
        reviews: [], // หากต้องการเพิ่มข้อมูล review สามารถปรับได้
        html_content: book.html_content
          ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
          : null,
      };
    });

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoriesByBookId = async (req, res) => {
  const { book_id } = req.params;
  if (!book_id) {
    return res.status(400).json({ error: "book_id is required" });
  }

  try {
    const categories = await prisma.bookCategory.findMany({
      where: {
        book_id: book_id.toString(),
      },
      include: {
        category: true, // ดึงข้อมูล category ทั้งหมดที่เชื่อมกับหนังสือ
      },
    });

    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found for this book" });
    }

    // ดึงชื่อหมวดหมู่
    const categoryNames = categories.map((entry) => entry.category.name);

    res.json({ book_id, categories: categoryNames });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

