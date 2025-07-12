import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: String,
      ref: "Hotel",
      required: true,
    },

    roomType: {
      type: String,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    amenities: {
      type: Array,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const Room = mongoose.model("Hotel", roomSchema);
export default Room;
