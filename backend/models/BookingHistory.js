import mongoose from "mongoose";

const BookingHistorySchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  bookingTime: { type: Date, required: true },
  completionTime: { type: Date },
  status: { type: String, enum: ["Completed", "Canceled"], required: true },
  slot: {
    // Store the slot information here
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  documents: [
    {
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ]
});

const BookingHistory = mongoose.model("BookingHistory", BookingHistorySchema);
export default BookingHistory;
