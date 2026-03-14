import express from 'express';
import { createStore, listStores, getStoreById, updateStore, deleteStore, bookAppointment, listBookedUsers, cancelBooking, listAllStores,  getAppointmentTimeSlotById, findStoreByOwnerId, listBookedUsersByTimeSlotId, completeAppointment, removeImage, addAppointmentSlot, removeAppointmentSlot, getBookingHistoryByStoreId, addFeedback, uploadBookingDocument } from '../controller/store.controller.js';
import upload from '../middleware/multerConfig.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create a new store
router.post('/create', auth, createStore);

// List all stores for the authenticated user
router.get('/list', auth, listStores);

// Get store details by ID
router.get('/findstore/:id', auth, getStoreById);

// Update store details
router.put('/update/:id', auth, updateStore);

// Delete a store
router.delete('/delete/:id', auth, deleteStore);

// Book an appointment at a store
router.post('/book', auth, bookAppointment);

// Book an appointment at a store
router.post('/appointments/complete', auth, completeAppointment);

// Cancel booking route
router.post('/cancel', auth, cancelBooking);

// image remove
router.delete('/remove-image', auth, removeImage);

// List booked users for a specific store
router.get('/:id/booked', auth, listBookedUsers);

// Route to list all stores
router.get('/stores', listAllStores);

// Route to fetch appointment slot by slot ID with extra
router.get('/stores/:storeId/slots/:slotId', getAppointmentTimeSlotById);

// Define the route to find stores by owner ID
router.get('/stores/owner/:ownerId', auth, findStoreByOwnerId);

// Define the route to find stores by owner ID
router.get('/stores/:storeId/slots/:slotId/booked-users', listBookedUsersByTimeSlotId);

// Add appointment slot
router.post('/stores/:storeId/appointment-slot', auth, addAppointmentSlot);

// remove appointment slot
router.delete('/stores/:storeId/slot/:slotId/:timeSlotId', auth, removeAppointmentSlot);

router.get("/stores/:storeId/booking-history", auth, getBookingHistoryByStoreId);

// Add Feedback
router.post('/stores/:storeId/feedback', auth, addFeedback);

// Upload user document for a specific booking history record
router.post('/history/:historyId/document', auth, upload.single('document'), uploadBookingDocument);

export default router;
