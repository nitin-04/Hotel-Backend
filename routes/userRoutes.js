import express from "express";
import {
  registerUser,
  loginUser,
  storeRecentSearchedCities,
  getUserData,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/".protect, getUserData);
userRouter.get("/store-recent-search".protect, storeRecentSearchedCities);
// userRouter.post("/register", registerUser);
// userRouter.post("/login", loginUser);

export default userRouter;
