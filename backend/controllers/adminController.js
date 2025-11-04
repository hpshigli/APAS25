// backend/controllers/adminController.js
import Admin from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET_1, { expiresIn: "7d" });
const isValidPesId = (id) => /^PES\d{10}$/.test(String(id || "").trim());

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Admin doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const adToken = createToken(admin.id);
    return res.json({ success: true, adToken });
  } catch (err) {
    console.error("loginAdmin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const registerAdmin = async (req, res) => {
  const { name, email, password, pesId } = req.body || {};
  try {
    if (!name || !email || !password || !pesId) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, password, and pesId are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }
    if (!isValidPesId(pesId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID. Expected format: PES1234567 (10 characters)",
      });
    }
    if (password.length < 8 || !validator.isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a strong password: minLength 8, minLowercase 1, minUppercase 1, minNumbers 1, minSymbols 1",
      });
    }

    // Uniqueness checks
    const [emailExists, idExists] = await Promise.all([
      Admin.findOne({ where: { email } }),
      Admin.findOne({ where: { pesId } }),
    ]);
    if (emailExists) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists. Please check the email" });
    }
    if (idExists) {
      return res.status(400).json({ success: false, message: "ID already exists" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name,
      email,
      pesId,
      password: hashedPassword,
    });

    const adToken = createToken(admin.id);
    return res.json({ success: true, adToken });
  } catch (err) {
    console.error("registerAdmin error:", err);
    // Handle unique constraint errors gracefully
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ success: false, message: "Email or ID already exists" });
    }
    return res.status(500).json({ success: false, message: "Error" });
  }
};
