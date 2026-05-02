const express = require("express");
const app = express();

app.use(express.json());

let otpStore = {}; // memory storage

// 🔥 SEND OTP
app.get("/send_otp", (req, res) => {
    const { email, phone } = req.query;

    if (!email || !phone) {
        return res.send("MISSING");
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // store
    otpStore[email] = {
        otp: otp,
        time: Date.now()
    };

    console.log("OTP:", otp);

    res.send("OTP_SENT");
});

// 🔥 VERIFY OTP
app.get("/verify_otp", (req, res) => {
    const { email, otp } = req.query;

    if (!email || !otp) {
        return res.send("MISSING");
    }

    const data = otpStore[email];

    if (!data) {
        return res.send("INVALID");
    }

    // 5 min expiry
    if (Date.now() - data.time > 5 * 60 * 1000) {
        return res.send("EXPIRED");
    }

    if (data.otp == otp) {
        return res.send("VERIFIED");
    } else {
        return res.send("INVALID");
    }
});

// server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
