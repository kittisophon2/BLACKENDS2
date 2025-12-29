const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- 1. (Admin) ดูรายการคำสั่งซื้อทั้งหมด ---
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        created_at: 'desc', // เรียงจากใหม่ไปเก่า
      },
      include: {
        user: { // ดึงข้อมูลคนซื้อ
          select: { username: true, email: true }
        },
        orderItems: { // ดึงรายการสินค้าในกล่อง
          include: {
            product: {
              select: { product_name: true, product_image: true }
            }
          }
        }
      }
    });

    // จัด Format ข้อมูลให้ดูง่าย (รวม path รูปภาพ)
    const formattedOrders = orders.map(order => ({
      ...order,
      slip_image: order.slip_image 
        ? `${req.protocol}://${req.get("host")}/images/${order.slip_image}` 
        : null,
      orderItems: order.orderItems.map(item => ({
        ...item,
        product: {
          ...item.product,
          product_image: item.product.product_image
            ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}`
            : null
        }
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. (Admin) ดูรายละเอียดคำสั่งซื้อรายตัว (By ID) ---
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { order_id: id },
      include: {
        user: true,
        orderItems: {
          include: { product: true }
        }
      }
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // (Code จัดการ URL รูปภาพเหมือนด้านบน ใส่ตรงนี้ได้ถ้าต้องการ)
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. (Admin) อัปเดตสถานะคำสั่งซื้อ ---
// เช่น เปลี่ยนจาก PENDING -> PAID (ยืนยันยอด) หรือ -> SHIPPED (ส่งของแล้ว)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // รับค่า status ใหม่ เช่น "PAID", "SHIPPED"

  try {
    const order = await prisma.order.update({
      where: { order_id: id },
      data: {
        status: status // ต้องตรงกับ enum OrderStatus ใน Prisma
      }
    });
    res.json({ message: "Status updated successfully", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};