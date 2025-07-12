import User from "../models/User.js";

export const protect = async () => {
  const { userId } = req.auth;
  if (!userId) {
    res.json({ success: false, message: "User is not logged in" });
  } else {
    const user = await User.findById(userId);
    req.user = user;
    next();
  }
};
