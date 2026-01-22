const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ดึงตะกร้าสินค้า
exports.getCart = async (req, res) => {
  const { user_id } = req.params;
  try {
    const cartItems = await prisma.orderItem.findMany({
      where: {
        user_id: user_id,
        status: "IN_CART",
        order_id: null
      },
      include: {
        product: true
      }
    });

    const formattedCart = cartItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        product_image: item.product.product_image 
          ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
          : "https://placehold.co/100"
      }
    }));

    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// เพิ่มสินค้าลงตะกร้า (แก้ไขแล้ว)
exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน (user_id, product_id, quantity)" });
  }

  try {
    // 1. เช็คสินค้าในตะกร้า (เฉพาะที่ยังไม่ได้จ่ายเงิน)
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        user_id: user_id,
        product_id: product_id,
        status: "IN_CART",
        order_id: null
      }
    });

    if (existingItem) {
      // 2. ถ้ามีในตะกร้าแล้ว ให้บวกเพิ่ม
      const updatedItem = await prisma.orderItem.update({
        where: { order_item_id: existingItem.order_item_id },
        data: { quantity: existingItem.quantity + parseInt(quantity) }
      });
      res.json({ message: "Updated quantity", item: updatedItem });
    } else {
      // 3. ถ้ายังไม่มีในตะกร้า ให้สร้างใหม่
      const product = await prisma.product.findUnique({ where: { product_id } });
      
      if (!product) {
        return res.status(404).json({ error: "ไม่พบสินค้า" });
      }
      
      const newItem = await prisma.orderItem.create({
        data: {
          user_id: user_id,
          product_id: product_id,
          quantity: parseInt(quantity),
          price: product.price,
          status: "IN_CART"
        }
      });
      res.json({ message: "Added to cart", item: newItem });
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้: " + error.message });
  }
};

// อัปเดตจำนวน
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

// ลบสินค้า
exports.removeCartItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    await prisma.orderItem.delete({
      where: { order_item_id: item_id }
    });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};