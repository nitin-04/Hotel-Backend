import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripeInstance = new Stripe(process.env.SECRET_KEY);

const stripeWebhooks = async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    try {
      await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: "Stripe",
      });
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  } else {
    console.log("Unhandled event type:", event.type);
  }

  response.json({ received: true });
};

export default stripeWebhooks;
