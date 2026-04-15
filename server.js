// server.js
import express from 'express';
import mongoose from 'mongoose';
import { graphqlHTTP } from 'express-graphql';
import dotenv from 'dotenv';
import cors from 'cors';
import schema, { root } from './graphql/schema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://192.168.0.151:8081',
  'exp://192.168.0.151:8081',
  'https://hairmaster-backend-1.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));



// ✅ VERY IMPORTANT (you were missing this)

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  rootValue: root,
  graphiql: true,
  context: { req },
})));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
