import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from 'cloudinary';
import User from '../models/User.js'; // Ensure the correct path and include .js extension
import { uploadImageOnCloudinary } from '../middleware/cloudinary.js';
import BookingHistory from '../models/BookingHistory.js';
import Store from '../models/store.js';

// Controller for User Registration
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user
    user = new User({
      name,
      email,
      password,
    });

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user to the database
    await user.save();

    // Generate a JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '100h' });

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
      maxAge: 100 * 60 * 60 * 1000, // 100 hours
    });

    res.status(200).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Controller for User Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate a JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '100h' });

    // Set the token in a cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Controller for User Logout
export const logout = async (req, res) => {
  try {
    // Clear the token from the cookie
    res.cookie('token', '', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
      expires: new Date(0) // Set the cookie to expire immediately
    });

    res.status(200).json({ msg: 'Logout successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Controller for listing all users
export const listUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Return the list of users
    res.status(200).json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// Controller for listing a user by ID
export const listUserById = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the user from the database by ID
    const user = await User.findById(id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return the user details
    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params; // Get user ID from URL
  const { name, address, phone } = req.body; // Additional details from the form
  let profilePictureUrl = '';

  try {
    // Check if a file was uploaded
    if (req.file) {
      // Upload the image to Cloudinary
      const result = await uploadImageOnCloudinary(req.file.path);
      profilePictureUrl = result.secure_url; // Save the URL of the uploaded image
    }

    // Find the user by ID and update details
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        address,
        phone,
        ...(profilePictureUrl && { profilePicture: profilePictureUrl }), // Update profile picture if uploaded
      },
      { new: true } // Return the updated document
    );

    // Check if the user was found
    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return the updated user details
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Controller to fetch booking history by userId
export const getBookingHistoryByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch booking history for the user (completed/canceled)
    const bookingHistory = await BookingHistory.find({ user: userId })
      .populate('store', 'name location phoneNumber') // Populate store details
      .sort({ bookingTime: -1 })
      .lean();

    // Fetch pending bookings from Store.bookedUsers
    const storesWithPending = await Store.find({ "bookedUsers.user": userId })
      .select('name location phoneNumber bookedUsers appointmentSlots')
      .lean();

    const pendingBookings = [];

    storesWithPending.forEach(store => {
      store.bookedUsers.forEach(booking => {
        if (booking.user.toString() === userId) {
          // Extract slot information if available
          let slotDate = new Date();
          let startTime = 'N/A';
          let endTime = 'N/A';

          if (store.appointmentSlots && booking.slot) {
            const appointmentSlot = store.appointmentSlots.find(slot => 
              slot.timeSlots && slot.timeSlots.some(ts => ts._id.toString() === booking.slot.toString())
            );
            
            if (appointmentSlot) {
              slotDate = appointmentSlot.date;
              const timeSlot = appointmentSlot.timeSlots.find(ts => ts._id.toString() === booking.slot.toString());
              if (timeSlot) {
                startTime = timeSlot.startTime;
                endTime = timeSlot.endTime;
              }
            }
          }

          pendingBookings.push({
            _id: booking._id,
            store: {
               _id: store._id,
               name: store.name,
               location: store.location,
               phoneNumber: store.phoneNumber
            },
            user: booking.user,
            name: booking.name,
            phoneNumber: booking.phoneNumber,
            address: booking.address,
            bookingTime: booking.bookingTime,
            status: 'Scheduled',
            slot: {
              date: slotDate,
              startTime: startTime,
              endTime: endTime
            }
          });
        }
      });
    });

    const combinedHistory = [...pendingBookings, ...bookingHistory].sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

    // Check if any history exists
    if (!combinedHistory.length) {
      return res.status(404).json({ msg: 'No booking history found for this user' });
    }

    // Send the fetched booking history
    res.json(combinedHistory);
  } catch (err) {
    console.error(`Error fetching booking history for user ${userId}: ${err.message}`);
    res.status(500).send('Server error');
  }
};
