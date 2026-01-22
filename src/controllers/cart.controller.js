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

    // 🛡️ [แก้ปัญหา 1] กรองเอาเฉพาะรายการที่สินค้ายังมีอยู่จริง (product ไม่เป็น null)
    // เพื่อป้องกัน Error หน้าขาวเวลามีสินค้าถูกลบไปแล้ว
    const validItems = cartItems.filter(item => item.product !== null);

    const formattedCart = validItems.map(item => ({
      ...item,
      // 🛡️ [แก้ปัญหา 2] ใช้ Optional Chaining (?) ป้องกัน Error ถ้ารูปไม่มี
      product: {
        ...item.product,
        product_image: item.product?.product_image 
          ? `${req.protocol}://${req.get("host")}/images/${item.product.product_image}` 
          : "https://placehold.co/150?text=No+Image" // รูปสำรอง
      }
    }));

    res.json(formattedCart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. หยิบของใส่ตะกร้า (Add to Cart) ---
exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { product_id } });
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

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
    console.error("Add Cart Error:", error);
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