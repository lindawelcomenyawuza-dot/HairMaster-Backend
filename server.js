import express from "express";
import mongoose from "mongoose";
import { graphqlHTTP } from "express-graphql";
import dotenv from "dotenv";
import schema from "./graphql/schema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/graphql", graphqlHTTP({
  schema,
  graphiql: true,
}));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));