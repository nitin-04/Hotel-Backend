import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// controllers/stripeWebhooks.js

const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(
      "❌ Stripe webhook signature verification failed",
      err.message
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Correct event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { bookingId } = session.metadata;

    console.log("✅ Booking ID from metadata:", bookingId);

    await Booking.findByIdAndUpdate(bookingId, {
      isPaid: true,
      status: "confirmed",
      paymentMethod: "Stripe",
    });

    return res.json({ received: true });
  }

  console.log("⚠️ Ignored event:", event.type);
  res.json({ received: true });
};

export default stripeWebhooks;
