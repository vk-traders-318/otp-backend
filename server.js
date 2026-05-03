const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("OTP Backend Running");
});

app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});
