const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "https://elevate-2025-two.vercel.app", "http://localhost:3000", "https://elevate2025.theuniques.in"
  ],
  credentials: true, // fixed spelling
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema & Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admissionNumber: { type: String, required: true, unique: true, match: /^[A-Za-z0-9]+$/ },
  department: { type: String, required: true },
  contact: { type: String, required: true, match: /^[0-9]{10}$/ },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", UserSchema);

// API Route - Register
app.post("/register", async (req, res) => {
    try {
        const { name, admissionNumber, department, contact, email } = req.body;

        // Check for existing user by email or admission number
        const existingUser = await User.findOne({
            $or: [{ email }, { admissionNumber }]
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or admission number already exists" });
        }

        const newUser = new User({ name, admissionNumber, department, contact, email });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error registering user", error });
    }
});

// Test Route
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
