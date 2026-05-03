const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// SEND OTP
exports.sendOtp = async (req, res) => {
  const { email, type } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.deleteMany({ email, type });
  await Otp.create({ email, otp, type });

  await sendEmail(email, otp);

  res.json({ success: true, message: "OTP sent" });
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp, type } = req.body;

  const record = await Otp.findOne({ email, otp, type });

  if (!record) return res.status(400).json({ message: "Invalid OTP" });

  res.json({ success: true });
};

// SIGNUP
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  const exist = await User.findOne({ email });
  if (exist) return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ email, password: hashed });

  res.json({ message: "Signup successful" });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token });
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  const hashed = await bcrypt.hash(newPassword, 10);

  await User.updateOne({ email }, { password: hashed });

  res.json({ message: "Password updated" });
};
