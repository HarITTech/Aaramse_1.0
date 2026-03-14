import { deleteImageFromCloudinary, uploadImageOnCloudinary } from '../middleware/cloudinary.js';
import upload from '../middleware/multerConfig.js';
import BookingHistory from '../models/BookingHistory.js';
import Store from '../models/store.js';
import User from '../models/User.js';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const sendPushNotification = async (pushToken, title, body) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }
  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  }];
  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error('Error sending push notification', error);
  }
};


// Modify the create store route to handle file uploads
export const createStore = async (req, res) => {
  // Use multer middleware to handle file uploads
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      console.error(`Upload error: ${err.message}`);
      return res.status(400).json({ msg: err.message });
    }

    const { name, type, fname, description, location, phoneNumber, aadharNumber, appointmentSlots } = req.body;

    try {
      const owner = req.user.id;

      if (!name || !type || !fname || !phoneNumber || !aadharNumber) {
        return res.status(400).json({ msg: 'Required fields are missing' });
      }

      // Validate and parse appointmentSlots
      let parsedAppointmentSlots = [];
      try {
        parsedAppointmentSlots = JSON.parse(appointmentSlots);
        // Validate date and timeSlots structure
        parsedAppointmentSlots.forEach(slot => {
          if (!slot.date || !Array.isArray(slot.timeSlots)) {
            throw new Error('Invalid structure for appointmentSlots');
          }
          slot.timeSlots.forEach(timeSlot => {
            if (!timeSlot.startTime || !timeSlot.endTime) {
              throw new Error('Invalid structure for timeSlots');
            }
          });
        });
      } catch (e) {
        console.error('Failed to parse appointmentSlots:', e.message);
        return res.status(400).json({ msg: 'Invalid format for appointmentSlots' });
      }

      // Process uploaded images and upload to Cloudinary
      const images = await Promise.all(req.files.map(async (file) => {
        try {
          const uploadResponse = await uploadImageOnCloudinary(file.path);
          return {
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id
          };
        } catch (error) {
          console.error('Error uploading image to Cloudinary:', error.message);
          return null;
        }
      }));

      const validImages = images.filter(image => image !== null);

      const store = new Store({
        owner,
        fname,
        type,
        name,
        description,
        location,
        phoneNumber,
        aadharNumber,
        appointmentSlots: parsedAppointmentSlots,
        images: validImages
      });

      await store.save();

      res.json(store);
    } catch (err) {
      console.error(`Error creating store: ${err.message}`);
      res.status(500).send('Server error');
    }
  });
};






// List all stores for the authenticated user
export const listStores = async (req, res) => {
  try {
    // Get stores created by the authenticated user
    const stores = await Store.find({ owner: req.user.id });
    res.json(stores);
  } catch (err) {
    console.error(`Error fetching stores: ${err.message}`);
    res.status(500).send('Server error');
  }
};

// Get store details by ID
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('feedbacks.user', 'name');
    if (!store) return res.status(404).json({ msg: 'Store not found' });
    res.json(store);
  } catch (err) {
    console.error(`Error fetching store: ${err.message}`);
    res.status(500).send('Server error');
  }
};

// Update store details
export const updateStore = async (req, res) => {
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err.message); // Add this line
      return res.status(400).json({ msg: err.message });
    }

    try {
      console.log("Request body:", req.body); // Add this line
      const store = await Store.findById(req.params.id);
      if (!store) return res.status(404).json({ msg: 'Store not found' });

      if (store.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }

      // Update images if any are uploaded
      if (req.files && req.files.length > 0) {
        const newImages = [];
        for (const file of req.files) {
          const uploadResponse = await uploadImageOnCloudinary(file.path);
          newImages.push({
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id, // or another unique identifier for the image
          });
        }
        store.images = [...store.images, ...newImages];
      }

      // Validate and update appointmentSlots
      const { appointmentSlots } = req.body;
      if (appointmentSlots) {
        let parsedAppointmentSlots;
        try {
          parsedAppointmentSlots = typeof appointmentSlots === 'string' ? JSON.parse(appointmentSlots) : appointmentSlots;
          parsedAppointmentSlots.forEach(slot => {
            if (!slot.date || !Array.isArray(slot.timeSlots)) {
              throw new Error('Invalid structure for appointmentSlots');
            }
            slot.timeSlots.forEach(timeSlot => {
              if (!timeSlot.startTime || !timeSlot.endTime) {
                throw new Error('Invalid structure for timeSlots');
              }
            });
          });

          store.appointmentSlots = parsedAppointmentSlots;
        } catch (e) {
          console.error('Failed to parse appointmentSlots:', e.message);
          return res.status(400).json({ msg: 'Invalid format for appointmentSlots' });
        }
      }

      const updateData = { ...req.body };
      delete updateData.images;
      delete updateData.appointmentSlots;

      Object.assign(store, updateData);

      await store.save();
      res.json(store);
    } catch (err) {
      console.error(`Error updating store: ${err.message}`);
      res.status(500).send('Server error');
    }
  });
};



// Delete a store
export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Check ownership
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Use findByIdAndDelete to remove the store
    await Store.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Store removed' });
  } catch (err) {
    console.error(`Error deleting store: ${err.message}`);
    res.status(500).send('Server error');
  }
};


// Book an appointment at a store
export const bookAppointment = async (req, res) => {
  const { storeId, appointmentSlotId, timeSlotId, name, phoneNumber, address, pushToken } = req.body;

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Find the appointment slot
    const appointmentSlot = store.appointmentSlots.find(slot => slot._id.toString() === appointmentSlotId);
    if (!appointmentSlot) return res.status(404).json({ msg: 'Appointment slot not found' });

    // Find the time slot within the appointment slot
    const timeSlot = appointmentSlot.timeSlots.find(slot => slot._id.toString() === timeSlotId);
    if (!timeSlot) return res.status(404).json({ msg: 'Time slot not found' });

    // Add the user details to the bookedUsers list with current booking time and queue number
    const queueNumber = store.bookedUsers.length + 1; // Assign next queue number
    store.bookedUsers.push({
      user: req.user.id,
      store: storeId,
      slot: timeSlotId,
      name,
      phoneNumber,
      address,
      bookingTime: new Date(), // Set current date and time
      queueNumber,
      pushToken
    });

    // Update the bookedSlots count for the time slot
    timeSlot.bookedSlots = (timeSlot.bookedSlots || 0) + 1;
    
    // Update the currentQueueNumber to reflect the last booking
    store.currentQueueNumber = queueNumber; // Update currentQueueNumber

    // Save the updated store
    await store.save();

    if (pushToken) {
      await sendPushNotification(pushToken, 'Booking Confirmed!', `Your booking is confirmed. You are number ${queueNumber} in the queue.`);
    }

    // Return the updated store with detailed user information
    const updatedStore = await Store.findById(storeId).populate('bookedUsers.user', 'name email');
    res.json(updatedStore);
  } catch (err) {
    console.error(`Error booking appointment: ${err.message}`);
    res.status(500).send('Server error');
  }
};




// Cancel a booking
export const cancelBooking = async (req, res) => {
  const { storeId, slotId, userId } = req.body;

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Find the booking to remove
    const bookingIndex = store.bookedUsers.findIndex(
      (booking) => booking.user.toString() === userId && booking.slot.toString() === slotId
    );

    if (bookingIndex === -1) return res.status(404).json({ msg: 'Booking not found' });

    // Remove the booking from the store
    store.bookedUsers.splice(bookingIndex, 1);

    // Save the updated store
    await store.save();

    res.json({ msg: 'Booking canceled' });
  } catch (err) {
    console.error(`Error canceling booking: ${err.message}`);
    res.status(500).send('Server error');
  }
};

// List booked users for a specific store
export const listBookedUsers = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('bookedUsers.user', 'name email');
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Check if the user is the owner or admin
    const user = await User.findById(req.user.id);
    if (!user || (user.id !== store.owner.toString() && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(store.bookedUsers);
  } catch (err) {
    console.error(`Error listing booked users: ${err.message}`);
    res.status(500).send('Server error');
  }
};

// List all stores
export const listAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email').lean(); // Use .lean() for plain JS objects

    const processedStores = stores.map(store => {
      const processedSlots = (store.appointmentSlots || []).map(slot => {
        const processedTimeSlots = (slot.timeSlots || []).map(ts => {
          const slotId = slot._id ? slot._id.toString() : null;
          const timeSlotId = ts._id ? ts._id.toString() : null;

          const totalBooked = (store.bookedUsers || []).reduce((count, user) => {
            if (user.slot && user.timeSlotId &&
                user.slot.toString() === slotId &&
                user.timeSlotId.toString() === timeSlotId) {
              count += 1;
            }
            return count;
          }, 0);

          return {
            ...ts,
            totalBooked
          };
        });

        return {
          ...slot,
          timeSlots: processedTimeSlots
        };
      });

      return {
        ...store,
        appointmentSlots: processedSlots
      };
    });

    res.json(processedStores);
  } catch (err) {
    console.error(`Error fetching all stores: ${err.message}`);
    res.status(500).send('Server error');
  }
};


// Fetch appointment time slot by Slot ID
export const getAppointmentTimeSlotById = async (req, res) => {
  const { storeId, slotId } = req.params;

  try {
    // Find the store by ID
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Iterate through appointment slots to find the specific time slot
    let foundTimeSlot = null;

    store.appointmentSlots.forEach(appointmentSlot => {
      const timeSlot = appointmentSlot.timeSlots.find(timeSlot => timeSlot._id.toString() === slotId);
      if (timeSlot) foundTimeSlot = timeSlot;
    });

    if (!foundTimeSlot) return res.status(404).json({ msg: 'Time slot not found' });

    // Return the found time slot details
    res.json(foundTimeSlot);
  } catch (err) {
    console.error(`Error fetching appointment time slot: ${err.message}`);
    res.status(500).send('Server error');
  }
};


// Find stores by owner ID
export const findStoreByOwnerId = async (req, res) => {
  const { ownerId } = req.params;

  try {
    // Find stores where the owner matches the provided owner ID
    const stores = await Store.find({ owner: ownerId }).populate('owner', 'name email');

    // Check if any stores were found
    if (stores.length === 0) {
      return res.status(404).json({ msg: 'No stores found for this owner' });
    }

    res.json(stores);
  } catch (err) {
    console.error(`Error fetching stores by owner ID: ${err.message}`);
    res.status(500).send('Server error');
  }
};


// List all booked users by time slot ID
export const listBookedUsersByTimeSlotId = async (req, res) => {
  const { storeId, slotId } = req.params;

  try {
    // Find the store by ID and populate booked users
    const store = await Store.findById(storeId).populate('bookedUsers.user', 'name email');
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Iterate through the appointment slots to find the matching slot
    let foundSlot = null;
    for (const appointmentSlot of store.appointmentSlots) {
      const slot = appointmentSlot.timeSlots.find(ts => ts._id.toString() === slotId);
      if (slot) {
        foundSlot = slot;
        break;
      }
    }

    if (!foundSlot) return res.status(404).json({ msg: 'Slot not found' });

    // Filter booked users based on the slot ID
    const bookedUsersForSlot = store.bookedUsers.filter(booking => booking.slot.toString() === slotId);

    // If no users are booked for the slot
    if (bookedUsersForSlot.length === 0) {
      return res.status(404).json({ msg: 'No users booked for this slot' });
    }

    res.json(bookedUsersForSlot);
  } catch (err) {
    console.error(`Error fetching booked users by time slot ID: ${err.message}`);
    res.status(500).send('Server error');
  }
};

export const completeAppointment = async (req, res) => {
  const { storeId, bookedId, status } = req.body;

  // Validate status
  if (!['Completed', 'Canceled'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Ensure the request is made by the store owner
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find the booking by bookedId
    const bookingIndex = store.bookedUsers.findIndex(
      (booking) => booking._id.toString() === bookedId
    );
    if (bookingIndex === -1) return res.status(404).json({ msg: 'Booking not found' });

    // Get the booking to be updated
    const [completedBooking] = store.bookedUsers.splice(bookingIndex, 1);

    // Extract the slot information from appointmentSlots if needed (optional)
    const appointmentSlot = store.appointmentSlots.find((slot) => 
      slot.timeSlots.some((timeSlot) => timeSlot._id.toString() === completedBooking.slot.toString())
    );

    if (!appointmentSlot) {
      return res.status(404).json({ msg: 'Time slot not found' });
    }

    const timeSlot = appointmentSlot.timeSlots.find(
      (timeSlot) => timeSlot._id.toString() === completedBooking.slot.toString()
    );

    if (!timeSlot) {
      return res.status(404).json({ msg: 'Time slot not found' });
    }

    // Create a new BookingHistory entry
    await BookingHistory.create({
      store: storeId,
      user: completedBooking.user,
      name: completedBooking.name,
      phoneNumber: completedBooking.phoneNumber,
      address: completedBooking.address,
      bookingTime: completedBooking.bookingTime,
      completionTime: status === 'Completed' ? new Date() : null,
      status: status,
      slot: {
        date: appointmentSlot.date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime
      }
    });

    // Update the current queue number
    store.currentQueueNumber = store.bookedUsers.length;

    // Save the updated store
    await store.save();

    // Notify the user whose appointment was completed or canceled
    if (completedBooking.pushToken) {
      if (status === 'Completed') {
        await sendPushNotification(completedBooking.pushToken, 'Appointment Completed!', `Thank you for choosing ${store.name}.`);
      } else if (status === 'Canceled') {
        await sendPushNotification(completedBooking.pushToken, 'Appointment Canceled', `Your appointment at ${store.name} was canceled.`);
      }
    }

    // Notify others in line about the queue moving
    for (let i = 0; i < store.bookedUsers.length; i++) {
      const waitingUser = store.bookedUsers[i];
      if (waitingUser.pushToken) {
        // We consider their position in the store.bookedUsers as their live queue status
        let newPos = i + 1;
        await sendPushNotification(waitingUser.pushToken, 'Queue Update', `Someone ahead of you finished! You are now number ${newPos} in line.`);
      }
    }

    // Return the updated store
    res.json(store);
  } catch (err) {
    console.error(`Error completing appointment: ${err.message}`);
    res.status(500).send('Server error');
  }
};



export const removeImage = async (req, res) => {
  const { storeId, imageId } = req.body;

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ msg: 'Store not found' });
    }

    // Ensure the request is made by the store owner
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find the image by public_id or another identifier
    const imageIndex = store.images.findIndex(image => image.public_id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ msg: 'Image not found' });
    }

    // Remove the image from the store's images array
    const [removedImage] = store.images.splice(imageIndex, 1);

    // Optionally delete the image from Cloudinary
    if (removedImage.public_id) {
      await deleteImageFromCloudinary(removedImage.public_id);
    }

    // Save the updated store
    await store.save();

    res.json({ msg: 'Image removed successfully', store });
  } catch (err) {
    console.error(`Error removing image: ${err.message}`);
    res.status(500).send('Server error');
  }
};

export const addAppointmentSlot = async (req, res) => {
  const { storeId } = req.params;
  const { date, timeSlots } = req.body;

  // Validate input
  if (!date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    return res.status(400).json({ msg: 'Invalid appointment slot format' });
  }

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Validate timeSlots
    timeSlots.forEach(slot => {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ msg: 'Invalid time slot format' });
      }
    });

    // Add the new appointment slot to the store
    store.appointmentSlots.push({ date, timeSlots });
    await store.save();

    res.json(store);
  } catch (err) {
    console.error(`Error adding appointment slot: ${err.message}`);
    res.status(500).send('Server error');
  }
};


export const removeAppointmentSlot = async (req, res) => {
  const { storeId, slotId, timeSlotId } = req.params; // Extract storeId, slotId, and timeSlotId from URL parameters

  try {
    // Find the store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ msg: 'Store not found' });
    }

    // Ensure the request is made by the store owner
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Find the appointment slot
    const appointmentSlot = store.appointmentSlots.find(slot =>
      slot._id.toString() === slotId
    );

    if (!appointmentSlot) {
      return res.status(404).json({ msg: 'Appointment slot not found' });
    }

    console.log("Appointment Slot found:", appointmentSlot);

    // Find and remove the time slot
    const timeSlotIndex = appointmentSlot.timeSlots.findIndex(timeSlot =>
      timeSlot._id.toString() === timeSlotId
    );

    if (timeSlotIndex === -1) {
      return res.status(404).json({ msg: 'Time slot not found' });
    }

    console.log("Time Slot to be removed:", appointmentSlot.timeSlots[timeSlotIndex]);

    appointmentSlot.timeSlots.splice(timeSlotIndex, 1);

    // Remove the appointment slot if it has no time slots left
    if (appointmentSlot.timeSlots.length === 0) {
      const slotIndex = store.appointmentSlots.findIndex(slot =>
        slot._id.toString() === slotId
      );
      store.appointmentSlots.splice(slotIndex, 1);
    }

    // Save the updated store
    await store.save();

    // Return the updated store data
    res.json(store);
  } catch (err) {
    console.error(`Error removing appointment slot: ${err.message}`);
    res.status(500).send('Server error');
  }
};


export const getBookingHistoryByStoreId = async (req, res) => {
  const { storeId } = req.params;

  try {
    const bookingHistory = await BookingHistory.find({ store: storeId })
      .populate('user', 'name email')
      .exec();

    res.json(bookingHistory);
  } catch (err) {
    console.error(`Error fetching booking history for store ${storeId}: ${err.message}`);
    res.status(500).send('Server error');
  }
};

export const addFeedback = async (req, res) => {
  const { storeId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ msg: 'Rating is required' });
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Check if user already submitted feedback
    const existingIndex = store.feedbacks.findIndex(f => f.user.toString() === req.user.id);
    
    if (existingIndex !== -1) {
      store.feedbacks[existingIndex].rating = rating;
      store.feedbacks[existingIndex].comment = comment;
      store.feedbacks[existingIndex].createdAt = new Date();
    } else {
      store.feedbacks.push({
        user: req.user.id,
        rating,
        comment,
      });
    }

    await store.save();
    res.json({ msg: 'Feedback submitted successfully', store });
  } catch (err) {
    console.error(`Error submitting feedback: ${err.message}`);
    res.status(500).send('Server error');
  }
};

export const uploadBookingDocument = async (req, res) => {
  const { historyId } = req.params;
  let documentUrl = '';

  try {
    if (req.file) {
      const result = await uploadImageOnCloudinary(req.file.path);
      documentUrl = result.secure_url;
    } else {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const bookingHistory = await BookingHistory.findById(historyId);
    if (!bookingHistory) return res.status(404).json({ msg: 'Booking history not found' });

    bookingHistory.documents.push({ url: documentUrl });
    await bookingHistory.save();

    res.json({ msg: 'Document uploaded successfully', document: documentUrl });
  } catch (err) {
    console.error(`Error uploading document: ${err.message}`);
    res.status(500).send('Server error');
  }
};

