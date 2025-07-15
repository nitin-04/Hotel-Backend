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

    const payload = whook.verify(JSON.stringify(req.body), headers); //  store the payload

    const { data, type } = payload;

    const userData = {
      _id: data.id,
      username: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses?.[0]?.email_address,
      image: data.image_url,
    };
    console.log("📩 Webhook triggered:", req.body?.type);
    console.log("👤 User ID:", req.body?.data?.id);

    switch (type) {
      case "user.created": {
        await User.create(userData);
        break;
      }
      case "user.updated": {
        await User.findByIdAndUpdate(data.id, userData); // ✅ Fix argument order
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        break;
      }
      default:
        break;
    }

    res
      .status(200)
      .json({ success: true, message: `Webhook processed: ${type}` });
  } catch (error) {
    console.error("Clerk webhook error:", error.message);
    res.status(400).json({
      success: false,
      message: "Invalid webhook",
      error: error.message,
    });
  }
};

export default clerkWebhooks;
