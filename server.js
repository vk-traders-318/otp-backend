const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🔥 Test route
app.get("/", (req, res) => {
  res.send("OTP Backend Running 🚀");
});

// 🔥 Gmail transporter (App Password जरूरी)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔥 Send OTP Route (NO HANG VERSION)
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email required" });
    }

    // OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 👉 IMPORTANT: पहले response भेजो (app unblock)
    res.status(200).json({ msg: "OTP processing...", otp: otp });

    // 👉 फिर email भेजो (background में)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: "Your OTP is: " + otp
    }, (error, info) => {
      if (error) {
        console.log("Email Error:", error);
      } else {
        console.log("OTP Sent:", info.response);
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// 🔥 PORT fix (Railway compatible)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
