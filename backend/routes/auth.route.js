// Importing express and controllers using ES module syntax
import express from 'express';
import { register, login, logout, listUsers, listUserById, updateUser, getBookingHistoryByUserId } from '../controller/auth.controller.js'; // Ensure to add .js extension
import auth from '../middleware/auth.js';
import upload from '../middleware/multerConfig.js';

// Create a router instance
const router = express.Router();

// Register Route
router.post('/register', register);

// Login Route
router.post('/login', login);

//logout route
router.post('/logout', logout);



// Route to list all users
router.get('/users', listUsers);


// Route to list a user by ID
router.get('/users/:id', auth, listUserById);

// Update user profile, including profile picture, address, and phone number
router.put('/update/:id', upload.single('profilePicture'), updateUser);

// Route to get booking history by userId
router.get('/history/:userId',auth, getBookingHistoryByUserId);


// Export the router as default
export default router;