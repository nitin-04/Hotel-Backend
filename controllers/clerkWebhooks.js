import { Webhook } from "svix";
import "dotenv/config";
import User from "../models/User.js";

const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const payload = whook.verify(JSON.stringify(req.body), headers);
    const { data, type } = payload;

    const userData = {
      _id: data.id,
      username: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses?.[0]?.email_address,
      image: data.image_url,
    };

    switch (type) {
      case "user.created": {
        const createdUser = await User.create(userData);
        console.log(" User created in DB:", createdUser);
        break;
      }
      case "user.updated": {
        const updatedUser = await User.findByIdAndUpdate(data.id, userData);
        console.log(" User updated:", updatedUser);
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        console.log(" User deleted:", data.id);
        break;
      }
      default:
        console.log("Unhandled event type:", type);
        break;
    }

    res
      .status(200)
      .json({ success: true, message: `Webhook processed: ${type}` });
  } catch (error) {
    console.error(" Clerk Webhook Error:", error.message);
    res.status(400).json({
      success: false,
      message: "Invalid webhook",
      error: error.message,
    });
  }
};

export default clerkWebhooks;
