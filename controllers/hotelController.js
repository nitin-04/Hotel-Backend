import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { name, address, contact, city } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const hotel = await Hotel.findOne({ owner: userId });
    if (hotel) {
      return res
        .status(400)
        .json({ success: false, message: "Hotel already registered" });
    }

    const newHotel = await Hotel.create({
      name,
      address,
      contact,
      city,
      owner: userId,
    });

    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { role: "hotelOwner" }
    );

    return res.status(201).json({
      success: true,
      message: "Hotel registered successfully",
      newHotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Hotel not registered: " + error.message,
    });
  }
};
