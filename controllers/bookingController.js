import Booking from "../models/Booking";
import Room from "../models/Room";

export const checkAvailability = async ({
  checkInDate,
  checkOutDate,
  room,
}) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $gte: checkInDate },
      checkOutDate: { $lte: checkOutDate },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const checkAvailabilityApi = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, room } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room not available" });
    }
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice = totalPrice * nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      checkInDate,
      checkOutDate,
      guests: +guests,
      totalPrice,
    });
    res.json({
      success: true,
      message: "Booking created successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res.json({ success: false, message: "Hotel not registered" });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    const totalBooking = bookings.length;
    const totalRevenue = bookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    );

    res.json({
      success: true,
      dashboardData: { totalBooking, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
