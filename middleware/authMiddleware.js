import User from "../models/User.js"; // Make sure path is correct

export const protect = async (req, res, next) => {
  try {
    // 1. Get the user ID from Clerk's authentication state
    const { userId } = await req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    // 2. Find the user in YOUR database using the clerkUserId field
    //    DO NOT use findById(). Use findOne() on the field you stored the Clerk ID in.
    const user = await User.findOne({ clerkUserId: userId });
    console.log("user: ", user);

    if (!user) {
      // This can happen if the webhook for user creation failed or hasn't run yet
      return res.status(404).json({
        success: false,
        message: "User not found in the application database.",
      });
    }

    // 3. Attach the user document from your database to the request object
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
