const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all reading lists with book and user details
exports.getAll = async (req, res) => {
  try {
    const readingLists = await prisma.readingList.findMany({
      include: {
        book: {
          include: {
            reviews: true,
          },
        },
        user: true,
      },
    });
    res.json(readingLists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reading lists by user ID with book details
exports.getByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const readingList = await prisma.readingList.findMany({
      where: { user_id },
      include: {
        book: {
          include: {
            reviews: {
              include: {
                user: true,
              },
            },
          },
        },
        user: true,
      },
    });

    const formattedReadingList = readingList.map((entry) => ({
      reading_id: entry.reading_id.toString(), // เปลี่ยนจาก id เป็น reading_id
      user_id: entry.user_id.toString(),
      book_id: entry.book_id.toString(),
      status: entry.status,
      add_date: entry.add_date,
      start_date: entry.start_date,
      finish_date: entry.finish_date,
      book: entry.book
        ? {
            book_id: entry.book.book_id.toString(),
            title: entry.book.title,
            author: entry.book.author,
            publish_year: entry.book.publish_year,
            description: entry.book.description,
            book_photo: entry.book.book_photo
              ? `${req.protocol}://${req.get("host")}/images/${entry.book.book_photo}`
              : null,
            summary: entry.book.summary,
            added_to_list_count: entry.book.added_to_list_count,
            average_rating: entry.book.average_rating,
            review_count: entry.book.review_count,
            html_content: entry.book.html_content
              ? `${req.protocol}://${req.get("host")}/html_books/${entry.book.html_content}`
              : null,
            reviews: entry.book.reviews.map((review) => ({
              review_id: review.review_id.toString(),
              user: {
                user_id: review.user.user_id.toString(),
                username: review.user.username,
                email: review.user.email,
              },
              rating: review.rating,
              comment: review.comment,
              review_date: review.review_date,
            })),
          }
        : null,
      user: entry.user
        ? {
            user_id: entry.user.user_id.toString(),
            username: entry.user.username,
            email: entry.user.email,
            picture: entry.user.picture
              ? `${req.protocol}://${req.get("host")}/profile_pictures/${entry.user.picture}`
              : null,
            created_at: entry.user.created_at,
            updated_at: entry.user.updated_at,
          }
        : null,
    }));

    res.json(formattedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new reading list entry
exports.add = async (req, res) => {
  try {
    console.log("📌 Received request body:", req.body);

    const { user_id, book_id, status, finish_date, start_date } = req.body;

    if (!user_id || !book_id) {
      return res.status(400).json({ error: "Missing user_id or book_id" });
    }

    // 🔍 ตรวจสอบว่าหนังสือเล่มนี้มีอยู่ในคลังของผู้ใช้หรือยัง
    const existingEntry = await prisma.readingList.findFirst({
      where: {
        user_id,
        book_id,
      },
    });

    if (existingEntry) {
      return res.status(400).json({ error: "หนังสือเล่มนี้อยู่ในคลังแล้ว 📚" });
    }

    // ✅ ถ้ายังไม่มี ให้เพิ่มหนังสือเข้าไป
    const newReadingList = await prisma.readingList.create({
      data: {
        user_id,
        book_id,
        status: status || "reading",
        start_date: start_date ? new Date(start_date) : new Date(),
        finish_date: finish_date ? new Date(finish_date) : null,
      },
    });

    res.json(newReadingList);
  } catch (error) {
    console.error("❌ Error in adding to reading list:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update a reading list entry
exports.update = async (req, res) => {
  const { reading_id } = req.params; // เปลี่ยนจาก user_id และ book_id เป็น reading_id
  const { status, finish_date, start_date } = req.body;
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { reading_id }, // เปลี่ยนจาก user_id_book_id เป็น reading_id
      data: {
        status,
        finish_date: finish_date ? new Date(finish_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
    });
    res.json(updatedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReadingListByUserAndBook = async (req, res) => {
  const { user_id, book_id } = req.query;
  try {
    const readingListEntry = await prisma.readingList.findFirst({
      where: {
        user_id,
        book_id,
      },
    });

    if (!readingListEntry) {
      return res.status(404).json({ error: "Reading list entry not found" });
    }

    res.json(readingListEntry);
  } catch (error) {
    console.error("Error fetching reading list entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Start reading a book
exports.startReading = async (req, res) => {
  const { reading_id } = req.params;

  try {
    // ตรวจสอบว่า reading_id มีอยู่ในฐานข้อมูลหรือไม่
    const existingEntry = await prisma.readingList.findUnique({
      where: { reading_id: reading_id },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Reading list entry not found" });
    }

    // อัปเดตสถานะและวันที่เริ่มอ่าน
    const updatedReadingList = await prisma.readingList.update({
      where: { reading_id: reading_id },
      data: {
        status: "READING",
        start_date: new Date(),
      },
    });

    res.json({
      message: "Status updated to reading",
      updatedReadingList,
    });
  } catch (error) {
    console.error("Error updating reading list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark a reading list entry as completed
exports.finishReading = async (req, res) => {
  const { reading_id } = req.params; // เปลี่ยนจาก id เป็น reading_id
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { reading_id }, // เปลี่ยนจาก id เป็น reading_id
      data: {
        status: "COMPLETED",
        finish_date: new Date(),
      },
    });
    res.json({
      message: "Status updated to completed",
      updatedReadingList,
    });
  } catch (error) {
    res.status(404).json({ error: "Reading list entry not found or invalid id" });
  }
};

// Delete a reading list entry
exports.delete = async (req, res) => {
  const { reading_id } = req.params; // เปลี่ยนจาก user_id และ book_id เป็น reading_id
  try {
    const deletedReadingList = await prisma.readingList.delete({
      where: { reading_id }, // เปลี่ยนจาก user_id_book_id เป็น reading_id
    });
    res.json(deletedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to find fastest readers
exports.findFastestReaders = async (req, res) => {
  try {
    const readingLists = await prisma.readingList.findMany({
      where: {
        finish_date: {
          not: null,
        },
      },
      include: {
        user: true,
      },
    });

    const userReadingTimes = {};
    readingLists.forEach((list) => {
      if (list.start_date && list.finish_date) {
        const timeDiff = list.finish_date.getTime() - list.start_date.getTime();
        const userId = list.user_id;

        if (!userReadingTimes[userId]) {
          userReadingTimes[userId] = {
            totalTime: 0,
            count: 0,
            username: list.user.username,
          };
        }

        userReadingTimes[userId].totalTime += timeDiff;
        userReadingTimes[userId].count++;
      }
    });

    const userAverageTimes = Object.entries(userReadingTimes).map(
      ([userId, data]) => ({
        userId,
        averageTime: data.totalTime / data.count,
        username: data.username,
      })
    );

    userAverageTimes.sort((a, b) => a.averageTime - b.averageTime);

    res.json(userAverageTimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};