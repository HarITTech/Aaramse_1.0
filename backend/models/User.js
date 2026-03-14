// Importing mongoose using ES module syntax
import mongoose from 'mongoose';

// Defining the User schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profilePicture: {
    type: String, // URL of the profile picture from Cloudinary
    default: '', // Set a default value or empty if not uploaded
  },
  address: {
    type: String,
    default: '', // Optional, can be updated later
  },
  phone: {
    type: String,
    default: '', // Optional, can be updated later
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Creating and exporting the User model
const User = mongoose.model('User', UserSchema);
export default User;
