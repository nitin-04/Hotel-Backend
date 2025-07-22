import User from "../models/User.js";
import { users } from "@clerk/clerk-sdk-node";

export const protect = async (req, res, next) => {
  try {
    const { userId } = await req.auth();
    // console.log("userId: ", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    let user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in the application database.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Protect middleware error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error in authentication middleware.",
    });
  }
};
