//server.js
import express from "express";
import mongoose from "mongoose";
import { graphqlHTTP } from "express-graphql";
import dotenv from "dotenv";
import schema from "./graphql/schema.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use("/graphql", graphqlHTTP((req) => ({
  schema,
  graphiql: true,
  context: { req },
})));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));