// ⚠️ dotenv MUST be loaded first — before any other imports read process.env
import dotenv from 'dotenv';
dotenv.config();

// Import dependencies using ES module syntax
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import storeRoutes from './routes/store.route.js';
import otpRoutes from './routes/otp.route.js';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.105.164:8081',
  'http://www.apalabajar.com'
];

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/otp', otpRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Appointment Booking Backend is running!');
});

// Health check / keep-alive ping endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
