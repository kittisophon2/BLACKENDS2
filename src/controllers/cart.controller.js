const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- 1. ดูสินค้าในตะกร้า (Get Cart) ---
exports.getCart = async (req, res) => {
  const { user_id } = req.params;

  try {
    const cleanUserId = user_id.trim();

    // 🔍 1. ดึงทุกอย่างของ User นี้ออกมาก่อน (ตัดปัญหา Database หาไม่เจอ)
    const allItems = await prisma.orderItem.findMany({
      where: {
        user_id: cleanUserId
      },
      include: {
        product: {
          select: {
            product_name: true,
            price: true,
            product_image: true,
            stock: true
          }
        }
      }
    });

    // 🛡️ 2. ใช้ JavaScript กรองเงื่อนไข (แม่นยำกว่า)
    const validItems = allItems.filter(item => {
      // เงื่อนไขที่ 1: ต้องมีข้อมูลสินค้าจริง (กันสินค้าผี)
      const hasProduct = item.product !== null;
      // เงื่อนไขที่ 2: สถานะต้องเป็น IN_CART
      const isInCart = item.status === "IN_CART";
      // เงื่อนไขที่ 3: ต้องยังไม่ถูกสั่งซื้อ (order_id เป็น null)
      const isNotInOrder = item.order_id === null || item.order_id === undefined;

      return hasProduct && isInCart && isNotInOrder;
    });

    // 3. จัดรูปแบบข้อมูล (ใส่รูปภาพ)
    const formattedCart = validItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        product_image: item.product?.product_image 
          ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
          : "https://placehold.co/150?text=No+Image"
      }
    }));

    res.json(formattedCart);

  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// src/controllers/cart.controller.js

exports.addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    // 1. ตรวจสอบว่าส่งค่ามาครบไหม
    if (!user_id || !product_id) {
        return res.status(400).json({ error: "User ID and Product ID are required" });
    }

    // 2. แปลงเป็น String และตัดช่องว่าง
    const cleanUserId = String(user_id).trim();
    const cleanProductId = String(product_id).trim();

    console.log(`Add to Cart: User=${cleanUserId}, Product=${cleanProductId}`); // Debug

    // 3. 🛡️ เพิ่มการตรวจสอบรูปแบบ ObjectID (ต้องเป็น Hex 24 ตัวเท่านั้น)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    if (!objectIdPattern.test(cleanUserId) || !objectIdPattern.test(cleanProductId)) {
        return res.status(400).json({ 
            error: "Invalid ID format. Must be a 24-character Hex string.",
            received: { user_id: cleanUserId, product_id: cleanProductId }
        });
    }

    // 4. เช็คว่ามีสินค้าจริงไหม?
    const product = await prisma.product.findUnique({ where: { product_id: cleanProductId } });
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    // 5. ดึงรายการสินค้าในตะกร้าของ User นี้ออกมาตรวจสอบ
    const userItems = await prisma.orderItem.findMany({
      where: { user_id: cleanUserId }
    });
    
    // หาว่ามีสินค้านี้อยู่ในตะกร้าแล้วหรือยัง (และยังไม่ได้สั่งซื้อ)
    const existingItem = userItems.find(item => 
      item.product_id === cleanProductId && 
      item.status === "IN_CART" && 
      (item.order_id === null || item.order_id === undefined)
    );

    if (existingItem) {
      // ถ้ามีแล้ว -> เพิ่มจำนวน
      const updatedItem = await prisma.orderItem.update({
        where: { order_item_id: existingItem.order_item_id },
        data: { quantity: existingItem.quantity + parseInt(quantity || 1) }
      });
      res.json({ message: "Updated quantity in cart", item: updatedItem });
    } else {
      // ถ้ายังไม่มี -> สร้างใหม่
      const newItem = await prisma.orderItem.create({
        data: {
          user_id: cleanUserId,
          product_id: cleanProductId,
          quantity: parseInt(quantity || 1),
          price: product.price,
          status: "IN_CART"
        }
      });
      res.json({ message: "Added to cart", item: newItem });
    }

  } catch (error) {
    console.error("Add Cart Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ... (copy ฟังก์ชัน updateCartItem, removeCartItem อันเดิมมาต่อท้ายได้เลย) ...
exports.updateCartItem = async (req, res) => {
  const { item_id } = req.params;
  const { quantity } = req.body;
  try {
    const updatedItem = await prisma.orderItem.update({
      where: { order_item_id: item_id },
      data: { quantity: parseInt(quantity) }
    });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    await prisma.orderItem.delete({
      where: { order_item_id: item_id }
    });
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};