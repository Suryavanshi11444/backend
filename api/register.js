import mongoose from "mongoose";
import Cors from "cors";

// Initialize CORS middleware
const cors = Cors({
  origin: [
    "https://elevate-2025-two.vercel.app",
    "http://localhost:3000",
    "https://elevate2025.theuniques.in",
  ],
  methods: ["GET", "POST", "OPTIONS"],
});

// Helper method to wait for middleware to execute
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Define schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admissionNumber: { type: String, required: true, unique: true, match: /^[A-Za-z0-9]+$/ },
  department: { type: String, required: true },
  contact: { type: String, required: true, match: /^[0-9]{10}$/ },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// API handler
export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    try {
      await connectToDatabase();

      const { name, admissionNumber, department, contact, email } = req.body;

      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { admissionNumber }],
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
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
