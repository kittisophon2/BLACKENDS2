const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ฟังก์ชันหาผู้ใช้ที่มีจำนวนรีวิวมากที่สุด
exports.getUserMostReview = async (req, res) => {
    try {
        const topReviewers = await prisma.review.groupBy({
            by: ['user_id'],
            _count: {
                review_id: true
            },
            orderBy: {
                _count: {
                    review_id: 'desc'
                }
            },
            take: 10 // ดึงมาเฉพาะ Top 10
        });

        // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้อง
        const userIds = topReviewers.map(review => review.user_id);
        const users = await prisma.user.findMany({
            where: {
                user_id: { in: userIds }
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                picture: true
            }
        });

        // รวมข้อมูลและแปลงค่า
        const usersWithUrls = topReviewers.map(reviewer => {
            const user = users.find(u => u.user_id === reviewer.user_id);
            return {
                ...user,
                user_id: reviewer.user_id.toString(),
                review_count: reviewer._count.review_id,
                pictureUrl: user?.picture
                    ? `${req.protocol}://${req.get("host")}/userpictures/${user.picture}`
                    : null,
            };
        });

        res.json(usersWithUrls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
