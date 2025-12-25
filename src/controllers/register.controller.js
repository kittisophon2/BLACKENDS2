const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const bcrypt = require("bcrypt");
const authService = require("../services/auth.service");
const fs = require("fs");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "userpictures/"); // Store files in the 'userpictures' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.originalname.split(".").pop());
  },
});

const upload = multer({ storage: storage });

// Fetch all users
exports.get = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const usersWithUrls = users.map((user) => ({
      ...user,
      id: user.user_id,
      pictureUrl: user.picture
        ? `${req.protocol}://${req.get("host")}/userpictures/${user.picture}`
        : null,
    }));
    res.json(usersWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch user by ID
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: id },
    });

    if (user) {
      user.pictureUrl = user.picture
        ? `${req.protocol}://${req.get("host")}/userpictures/${user.picture}`
        : null;
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register a new user
exports.create = async (req, res) => {
  upload.single("profilePicture")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { username, email, password } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      // Check for duplicate email or username
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email or Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          picture,
        },
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Update user
exports.update = async (req, res) => {
  upload.single("profilePicture")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { id } = req.params;
    const { username, email, password } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      const user = await prisma.user.findUnique({ where: { user_id: id } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete old picture if new picture is uploaded
      if (picture && user.picture) {
        const oldImagePath = path.join("userpictures", user.picture);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Hash password only if it’s updated
      let updatedPassword = user.password;
      if (password) {
        updatedPassword = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { user_id: id },
        data: {
          username,
          email,
          password: updatedPassword,
          picture: picture || user.picture,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Delete user
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { user_id: id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete picture if exists
    if (user.picture) {
      const imagePath = path.join("userpictures", user.picture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.user.delete({ where: { user_id: id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = authService.generateToken({ userId: user.user_id });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};