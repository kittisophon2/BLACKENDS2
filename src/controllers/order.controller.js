const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Config Multer สำหรับอัปโหลดสลิป ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/"); // ตรวจสอบว่ามีโฟลเดอร์ images หรือยัง
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "slip-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).single("slip_image");

// -----------------------------------------------------
// ส่วนของ User (สั่งซื้อ / แจ้งโอน)
// -----------------------------------------------------

// --- 1. สร้างคำสั่งซื้อ (Checkout) ---
exports.createOrder = async (req, res) => {
  // รับ user_id จาก token (ถ้ามี middleware) หรือรับจาก body ชั่วคราว
  const { user_id, address } = req.body; 

  if (!user_id || !address) {
    return res.status(400).json({ error: "User ID and Address are required" });
  }

  try {
    // 1. ดึงของในตะกร้า (IN_CART)
    const cartItems = await prisma.orderItem.findMany({
      where: {
        user_id: user_id,
        status: "IN_CART",
      },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. คำนวณราคารวม
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // 3. ทำ Transaction (สร้าง Order + อัปเดตรายการสินค้า)
    const result = await prisma.$transaction(async (prisma) => {
      // 3.1 สร้าง Order Header
      const newOrder = await prisma.order.create({
        data: {
          user_id: user_id,
          total_price: totalPrice,
          address: address,
          status: "PENDING", // รอชำระเงิน
        },
      });

      // 3.2 อัปเดตรายการสินค้า: ผูกกับ OrderID และเปลี่ยนสถานะ
      // หมายเหตุ: การ UpdateMany ไม่สามารถ Set ค่า Price แยกรายตัวได้ง่ายๆ 
      // ในที่นี้เราจะ Update สถานะก่อน
      await prisma.orderItem.updateMany({
        where: {
          order_item_id: { in: cartItems.map((i) => i.order_item_id) },
        },
        data: {
          order_id: newOrder.order_id,
          status: "PENDING",
        },
      });
      
      // (Optional) Loop เพื่อบันทึกราคา ณ วันที่ซื้อลงใน OrderItem (Snapshot Price)
      for (const item of cartItems) {
         await prisma.orderItem.update({
             where: { order_item_id: item.order_item_id },
             data: { price: item.product.price }
         });
      }

      return newOrder;
    });

    res.status(201).json({ message: "Order created successfully", order: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. แจ้งชำระเงิน (แนบสลิป) ---
exports.uploadSlip = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { id } = req.params; // Order ID
    const filename = req.file ? req.file.filename : null;

    if (!filename) {
      return res.status(400).json({ error: "Please upload slip image" });
    }

    try {
      const order = await prisma.order.update({
        where: { order_id: id },
        data: {
          slip_image: filename,
          status: "PAID", // หรือ "PENDING" เพื่อรอแอดมินกด Confirm อีกทีก็ได้
        },
      });

      res.json({ message: "Slip uploaded successfully", order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// --- 3. ดูประวัติการสั่งซื้อของตัวเอง ---
exports.getMyOrders = async (req, res) => {
    const { user_id } = req.params;
    try {
        const orders = await prisma.order.findMany({
            where: { user_id: user_id },
            orderBy: { created_at: 'desc' },
            include: {
                orderItems: {
                    include: { product: true }
                }
            }
        });
        
        // Format Url รูปภาพ
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
}


// -----------------------------------------------------
// ส่วนของ Admin (เดิม)
// -----------------------------------------------------

// --- 4. (Admin) ดูรายการคำสั่งซื้อทั้งหมด ---
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { username: true, email: true } },
        orderItems: {
          include: { product: { select: { product_name: true, product_image: true } } }
        }
      }
    });

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

// --- 5. (Admin) ดูรายละเอียดคำสั่งซื้อรายตัว (By ID) ---
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { order_id: id },
      include: {
        user: true,
        orderItems: { include: { product: true } }
      }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. (Admin) อัปเดตสถานะคำสั่งซื้อ ---
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { order_id: id },
      data: { status: status }
    });
    res.json({ message: "Status updated successfully", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};