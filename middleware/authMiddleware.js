import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User is not logged in" });
    }
    console.log("🧠 Clerk userId from req.auth:", req.auth?.userId);
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Protect middleware error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error in protect middleware" });
  }
};
