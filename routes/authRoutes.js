const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];
const otps = [];

// SEND OTP
router.post("/send-otp", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  otps.push({ email, otp });

  console.log(`OTP for ${email}: ${otp}`);

  res.json({ success: true, message: "OTP sent (check console in render logs)" });
});

// VERIFY OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otps.find(o => o.email === email && o.otp == otp);

  if (!record) return res.status(400).json({ message: "Invalid OTP" });

  res.json({ success: true });
});

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });

  res.json({ message: "User created" });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ email }, "secret");

  res.json({ token });
});

module.exports = router;
