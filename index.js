const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔗 MongoDB connect
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"))
.catch(err=>console.log("DB Error:", err));

// 📦 Schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiry: Number
});

const User = mongoose.model("User", userSchema);
const OTP = mongoose.model("OTP", otpSchema);

// 📧 Mail config (FINAL FIXED)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔹 health check
app.get("/", (req,res)=>res.send("Server Running"));

// 🔥 SEND OTP
app.post("/send_otp", async (req,res)=>{
  try {
    const { email } = req.body;

    if(!email) {
      return res.status(400).json({msg:"Email required"});
    }

    const otp = Math.floor(100000 + Math.random()*900000).toString();
    const expiry = Date.now() + 5*60*1000;

    await OTP.findOneAndUpdate(
      { email },
      { otp, expiry },
      { upsert: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({msg:"OTP_SENT"});

  } catch (e) {
    console.log("MAIL ERROR:", e); // 🔥 important log
    res.status(500).json({msg:"ERROR_SENDING_OTP"});
  }
});

// 🔥 VERIFY OTP
app.post("/verify_otp", async (req,res)=>{
  try {
    const { email, otp } = req.body;

    if(!email || !otp) {
      return res.status(400).json({msg:"MISSING"});
    }

    const data = await OTP.findOne({ email });

    if(!data) return res.json({msg:"INVALID"});
    if(Date.now() > data.expiry) return res.json({msg:"EXPIRED"});

    if(data.otp === otp){
      return res.json({msg:"VERIFIED"});
    } else {
      return res.json({msg:"INVALID"});
    }

  } catch (e) {
    console.log("VERIFY ERROR:", e);
    res.status(500).json({msg:"ERROR_VERIFY"});
  }
});

// 🔥 SIGNUP
app.post("/signup", async (req,res)=>{
  try {
    const { email, password } = req.body;

    if(!email || !password) return res.json({msg:"MISSING"});

    const exist = await User.findOne({ email });
    if(exist) return res.json({msg:"EXISTS"});

    const hash = await bcrypt.hash(password,10);

    await User.create({ email, password: hash });

    res.json({msg:"SIGNED_UP"});

  } catch (e) {
    console.log("SIGNUP ERROR:", e);
    res.status(500).json({msg:"ERROR_SIGNUP"});
  }
});

// 🔥 LOGIN
app.post("/login", async (req,res)=>{
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user) return res.json({msg:"NO_USER"});

    const ok = await bcrypt.compare(password, user.password);

    if(ok) res.json({msg:"LOGIN_SUCCESS"});
    else res.json({msg:"WRONG_PASSWORD"});

  } catch (e) {
    console.log("LOGIN ERROR:", e);
    res.status(500).json({msg:"ERROR_LOGIN"});
  }
});

// 🔥 RESET PASSWORD
app.post("/reset_password", async (req,res)=>{
  try {
    const { email, newPassword } = req.body;

    const hash = await bcrypt.hash(newPassword,10);

    await User.updateOne(
      { email },
      { password: hash }
    );

    res.json({msg:"PASSWORD_RESET"});

  } catch (e) {
    console.log("RESET ERROR:", e);
    res.status(500).json({msg:"ERROR_RESET"});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server Running"));
