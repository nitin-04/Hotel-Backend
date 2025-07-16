import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Let Mongoose handle the _id automatically
    clerkUserId: {
      type: String,
      required: true,
      unique: true, // Ensures no two users can have the same Clerk ID
      index: true, // Crucial for fast lookups by Clerk ID
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      // Consider if image is always required
    },
    role: {
      type: String,
      enum: ["user", "hotelOwner"],
      default: "user",
    },
    recentSearchedCities: [
      {
        type: String,
      },
    ],
  },
  {
    // This automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
