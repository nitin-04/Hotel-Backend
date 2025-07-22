import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import { v2 as cloudinary } from "cloudinary";
export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities } = req.body;
    // console.log("Clerk User ID:", req.auth?.userId);
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    // console.log(hotel);

    if (!hotel)
      return res.json({ success: false, message: "Hotel not registered" });

    const uploadImages = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);
      return response.secure_url;
    });
    const images = await Promise.all(uploadImages);
    await Room.create({
      hotel: hotel._id,
      roomType,
      pricePerNight: +pricePerNight,
      amenities: JSON.parse(amenities),
      images,
      isAvailable: true,
    });

    res.json({ success: true, message: "Room created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true })
      .populate({ path: "hotel", select: "name address image city" })
      .sort({ createdAt: -1 });
    // console.log(rooms);

    res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const getOwnerRooms = async (req, res) => {
  try {
    const hotelData = await Hotel.findOne({ owner: req.auth.userId });
    // console.log("User ID: ", req.auth.userId);

    if (!hotelData) {
      return res.json({
        success: false,
        message: "Hotel not found for this owner",
      });
    }

    const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate(
      "hotel"
    );

    res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;

    const roomData = await Room.findById(roomId);
    if (!roomData) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();

    return res.json({
      success: true,
      message: `Room is now ${
        roomData.isAvailable ? "available" : "unavailable"
      }`,
      isAvailable: roomData.isAvailable,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
  } catch (error) {}
};
