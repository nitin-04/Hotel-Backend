import checkAvailability, {
  checkAvailabilityApi,
  createBooking,
  getHotelBookings,
  getUserBookings,
} from "../controllers/bookingController";
import { protect } from "../middleware/authMiddleware";
import express from "express";

const bookingRouter = express.Router();

bookingRouter.post("/check-availability", checkAvailabilityApi);
bookingRouter.post("/book", protect, createBooking);
bookingRouter.get("/user", protect, getUserBookings);
bookingRouter.get("/hotel", protect, getHotelBookings);

export default bookingRouter;
