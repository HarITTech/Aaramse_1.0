import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fname: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    aadharNumber: {
      type: String,
      required: true,
    },
    appointmentSlots: [
      {
        date: {
          type: Date,
          required: true,
        },
        timeSlots: [
          {
            startTime: {
              type: String,
              required: true,
            },
            endTime: {
              type: String,
              required: true,
            },
            _id: {
              type: mongoose.Schema.Types.ObjectId,
              auto: true,
            }
          },
        ],
      },
    ],
    currentQueueNumber: {
      type: Number,
      default: 0,
    },
    bookedUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        slot: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AppointmentSlot',
          required: true,
        },
        bookingTime: {
          type: Date,
          default: Date.now,
        },
        name: {
          type: String,
        },
        phoneNumber: {
          type: String,
        },
        address: {
          type: String,
        },
        queueNumber: {
          type: Number,
        },
        pushToken: {
          type: String,
        },
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true
        },
        public_id: {
          type: String,
          required: true
        }
      }
    ],
    feedbacks: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        rating: { type: Number, required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
  },
  {
    timestamps: true, // This will add `createdAt` and `updatedAt` fields
  }
);

const Store = mongoose.model('Store', StoreSchema);
export default Store;
