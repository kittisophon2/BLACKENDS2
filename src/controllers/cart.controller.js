const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- 1. ดูสินค้าในตะกร้า (Get Cart) ---
exports.getCart = async (req, res) => {
  const { user_id } = req.params; // รับ User ID เพื่อดูตะกร้าของคนนั้น

  try {
    const cartItems = await prisma.orderItem.findMany({
      where: {
        user_id: user_id,
        status: "IN_CART", // ดึงเฉพาะของที่อยู่ในตะกร้า (ยังไม่สั่ง)
        order_id: null     // และยังไม่ได้ผูกกับออเดอร์ไหน
      },
      include: {
        product: {         // ดึงข้อมูลสินค้า (รูป, ราคา, ชื่อ) มาแสดงด้วย
          select: {
            product_name: true,
            price: true,
            product_image: true,
            stock: true
          }
        }
      }
    });

    // จัด Format รูปภาพให้สมบูรณ์
    const formattedCart = cartItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        product_image: item.product.product_image 
          ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
          : null
      }
    }));

    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. หยิบของใส่ตะกร้า (Add to Cart) ---
exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  try {
    // เช็คก่อนว่ามีสินค้านี้ในตะกร้าแล้วหรือยัง?
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        user_id: user_id,
        product_id: product_id,
        status: "IN_CART",
        order_id: null
      }
    });

    if (existingItem) {
      // ถ้ามีแล้ว ให้บวกจำนวนเพิ่ม
      const updatedItem = await prisma.orderItem.update({
        where: { order_item_id: existingItem.order_item_id },
        data: { quantity: existingItem.quantity + parseInt(quantity) }
      });
      res.json({ message: "Updated quantity in cart", item: updatedItem });
    } else {
      // ถ้ายังไม่มี ให้สร้างรายการใหม่
      // (ค้นหาราคาสินค้าปัจจุบันก่อน)
      const product = await prisma.product.findUnique({ where: { product_id } });
      
      const newItem = await prisma.orderItem.create({
        data: {
          user_id: user_id,
          product_id: product_id,
          quantity: parseInt(quantity),
          price: product.price, // บันทึกราคา ณ ตอนหยิบใส่ตะกร้า
          status: "IN_CART"
        }
      });
      res.json({ message: "Added to cart", item: newItem });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. แก้ไขจำนวนสินค้า (Update Quantity) ---
exports.updateCartItem = async (req, res) => {
  const { item_id } = req.params; // ID ของ OrderItem
  const { quantity } = req.body;  // จำนวนใหม่

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

// --- 4. ลบสินค้าออกจากตะกร้า (Remove Item) ---
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