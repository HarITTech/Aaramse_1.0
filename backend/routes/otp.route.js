import express from 'express';
import { sendOtp, verifyOtp } from '../controller/otp.controller.js';

const router = express.Router();

// Send OTP to given email
router.post('/send', sendOtp);

// Verify OTP submitted by user
router.post('/verify', verifyOtp);

export default router;
