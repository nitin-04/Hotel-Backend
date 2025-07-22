import express from "express";
import {
  getUserData,
  userRecentSearchedCities,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, userRecentSearchedCities);
// userRouter.post("/register", registerUser);
// userRouter.post("/login", loginUser);

export default userRouter;
