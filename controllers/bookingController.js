import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Stripe from "stripe";

const stripeInstance = new Stripe(process.env.SECRET_KEY);

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

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Hotel Booking Confirmation",
      html: `
        <h1>Your Booking Details</h1>
        <p>Dear ${req.user.username},</p>
        <p>Thank you for your booking! Here are your details: </p>
        <ul>
        <li><strong> Booking ID:</strong> ${booking._id}</li>
        <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
        <li><strong>Location:</strong> ${roomData.hotel.address}</li>
        <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
        <li<strong>Booking Amount:</strong> ${process.env.CURRENCY || "₹"}${
        booking.totalPrice
      } /night</li>
        </ul>
        <p>We look forward to welcoming you to our hotel!</p>
        <p>For any questions or concerns, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The StayFinder Team</p>
        `,
    };
    await transporter.sendMail(mailOptions);
    // console.log(mailOptions);

    res.json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    // console.log(user);

    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
    // console.log(bookings);
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

export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const { origin } = req.headers;

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: booking.totalPrice * 100, // in cents
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          bookingId,
        },
      },
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Payment Error:", error);
    res.json({ success: false, message: "Payment failed" });
  }
};
