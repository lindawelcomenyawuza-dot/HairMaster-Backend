//server.js
import express from "express";
import mongoose from "mongoose";
import { graphqlHTTP } from "express-graphql";
import dotenv from "dotenv";
import cors from "cors";
import schema from "./graphql/schema.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS FIX (IMPORTANT)
app.use(cors({
  origin: [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000", // ✅ ADD THIS
  "https://hair-master-app-web.vercel.app"
],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// GraphQL
app.use("/graphql", graphqlHTTP((req) => ({
  schema,
  graphiql: true,
  context: { req },
})));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));