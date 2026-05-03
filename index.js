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
.catch(err=>console.log(err));

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

// 📧 Mail config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔹 health
app.get("/", (req,res)=>res.send("Server Running"));

// 🔥 SEND OTP
app.get("/send_otp", async (req,res)=>{
  const { email } = req.query;
  if(!email) return res.send("MISSING");

  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expiry = Date.now() + 5*60*1000;

  await OTP.findOneAndUpdate(
    { email },
    { otp, expiry },
    { upsert: true }
  );

  try{
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is: ${otp}`
    });

    res.send("OTP_SENT");
  }catch(e){
    console.log(e);
    res.send("MAIL_ERROR");
  }
});

// 🔥 VERIFY OTP
app.get("/verify_otp", async (req,res)=>{
  const { email, otp } = req.query;
  if(!email || !otp) return res.send("MISSING");

  const data = await OTP.findOne({ email });

  if(!data) return res.send("INVALID");
  if(Date.now() > data.expiry) return res.send("EXPIRED");

  if(data.otp === otp){
    return res.send("VERIFIED");
  } else {
    return res.send("INVALID");
  }
});

// 🔥 SIGNUP
app.post("/signup", async (req,res)=>{
  const { email, password } = req.body;

  if(!email || !password) return res.send("MISSING");

  const exist = await User.findOne({ email });
  if(exist) return res.send("EXISTS");

  const hash = await bcrypt.hash(password,10);

  await User.create({ email, password: hash });

  res.send("SIGNED_UP");
});

// 🔥 LOGIN
app.post("/login", async (req,res)=>{
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if(!user) return res.send("NO_USER");

  const ok = await bcrypt.compare(password, user.password);
  if(ok) res.send("LOGIN_SUCCESS");
  else res.send("WRONG_PASSWORD");
});

// 🔥 RESET PASSWORD
app.post("/reset_password", async (req,res)=>{
  const { email, newPassword } = req.body;

  const hash = await bcrypt.hash(newPassword,10);

  await User.updateOne(
    { email },
    { password: hash }
  );

  res.send("PASSWORD_RESET");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server Running"));
