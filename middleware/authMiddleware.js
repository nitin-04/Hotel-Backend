import User from "../models/User.js"; // Make sure path is correct
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
    // console.log("user: ", user);

    // if (!user) {
    //   const clerkUser = await users.getUser(userId);

    //   user = await User.create({
    //     clerkUserId: clerkUser.id,
    //     username: `${clerkUser.firstName || ""} ${
    //       clerkUser.lastName || ""
    //     }`.trim(),
    //     email: clerkUser.emailAddresses[0].emailAddress,
    //     image: clerkUser.imageUrl,
    //   });

    //   console.log("✅ Auto-created user in DB from Clerk profile:", user);
    // }

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
