import { Webhook } from "svix";
// import "dotenv/config";
import User from "../models/User.js"; // Ensure this path is correct

const clerkWebhooks = async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("CLERK_WEBHOOK_SECRET is not set in .env file");
    }

    const whook = new Webhook(WEBHOOK_SECRET);
    // Note: Use req.body directly if using a raw body parser middleware.
    // The svix library handles the stringification and header access.
    const payload = whook.verify(req.body, req.headers);
    // const payload = JSON.parse(req.body.toString());
    // console.log("Webhook Event Type:", payload.type);
    // console.log("Payload Data:", payload.data);

    const { data, type } = payload;
    const eventType = type;

    // --- IDEMPOTENT USER CREATION ---
    if (eventType === "user.created") {
      // Check if the user already exists in your database.
      const existingUser = await User.findOne({ clerkUserId: data.id });

      if (existingUser) {
        // If they exist, log it and send a 200 OK response.
        // This stops the webhook from being retried.
        console.log(`Webhook skipped: User ${data.id} already exists.`);
        return res
          .status(200)
          .json({ success: true, message: "User already exists" });
      }

      // If they don't exist, create them.
      const newUser = await User.create({
        clerkUserId: data.id,
        username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        email: data.email_addresses[0].email_address,
        image: data.image_url,
      });

      console.log("User created in DB:", newUser);
    }

    // --- USER UPDATED ---
    if (eventType === "user.updated") {
      const updateData = {
        username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        email: data.email_addresses[0].email_address,
        image: data.image_url,
      };

      const updatedUser = await User.findOneAndUpdate(
        { clerkUserId: data.id },
        updateData,
        { new: true }
      );

      console.log("User updated:", updatedUser);
    }

    // --- USER DELETED ---
    if (eventType === "user.deleted") {
      // For a deleted user, data.id might be the only info.
      // Clerk might also send a null `data` object for deleted users sometimes.
      const idToDelete = data.id;
      if (!idToDelete) {
        return res.status(400).json({
          success: false,
          message: "User ID for deletion is missing.",
        });
      }

      const deletedUser = await User.findOneAndDelete({
        clerkUserId: idToDelete,
      });
      console.log("User deleted:", deletedUser);
    }

    res
      .status(200)
      .json({ success: true, message: `Webhook processed: ${eventType}` });
  } catch (error) {
    console.error("Error in Clerk Webhook Handler:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default clerkWebhooks;
