const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- 1. ดูสินค้าในตะกร้า (Get Cart) ---
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

  // ✅ 1. เพิ่มการตรวจสอบค่าว่าง (Validation)
  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน (user_id, product_id, quantity)" });
  }

  try {
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        user_id: user_id,
        product_id: product_id,
        status: "IN_CART",
        order_id: null
      }
    });

    if (existingItem) {
      const updatedItem = await prisma.orderItem.update({
        where: { order_item_id: existingItem.order_item_id },
        data: { quantity: existingItem.quantity + parseInt(quantity) }
      });
      res.json({ message: "Updated quantity in cart", item: updatedItem });
    } else {
      // ค้นหาสินค้า
      const product = await prisma.product.findUnique({ where: { product_id } });
      
      // ✅ 2. เพิ่มการป้องกัน Error 500: ถ้าหาสินค้าไม่เจอ ให้แจ้งกลับไปดีๆ ไม่ใช่ปล่อยให้ Server พัง
      if (!product) {
        return res.status(404).json({ error: "ไม่พบสินค้านี้ในระบบ (Product Not Found)" });
      }
      
      const newItem = await prisma.orderItem.create({
        data: {
          user_id: user_id,
          product_id: product_id,
          quantity: parseInt(quantity),
          price: product.price, // จุดที่เคย Error คือตรงนี้ (ถ้า product เป็น null จะดึง price ไม่ได้)
          status: "IN_CART"
        }
      });
      res.json({ message: "Added to cart", item: newItem });
    }
  } catch (error) {
    console.error("Add to Cart Error:", error); // Log Error ดูใน Terminal ฝั่ง Server
    res.status(500).json({ error: error.message });
  }
};

// --- 3. แก้ไขจำนวนสินค้า (Update Quantity) ---
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