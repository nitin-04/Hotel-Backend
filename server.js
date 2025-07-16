import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import bodyParser from "body-parser";

connectDB();
connectCloudinary();

const app = express();
app.use(cors());

app.post(
  "/api/clerk",
  bodyParser.raw({ type: "application/json" }),
  clerkWebhooks
);
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/user", userRouter);
app.use("/api/hotel", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Wait for the database connection to be established first.
    await connectDB();

    // Only then, start listening for requests.
    app.listen(PORT, () => {
      console.log(
        `Server is running on port ${PORT} and connected to the database.`
      );
    });
  } catch (error) {
    console.error("Failed to start server due to database connection error.");
    console.error(error);
  }
};

startServer();
