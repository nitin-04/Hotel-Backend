import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripeWebhooks = async (request, response) => {
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body, // Make sure you are passing the RAW body
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed.", error);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object; // The paymentIntent object
    const { bookingId } = paymentIntent.metadata; // Get metadata DIRECTLY from the paymentIntent

    // Best practice: Ensure bookingId exists before updating the database
    if (bookingId) {
      try {
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentMethod: "Stripe",
        });
        console.log(`Booking ${bookingId} successfully updated to paid.`);
      } catch (dbError) {
        console.error(
          `Failed to update booking ${bookingId} in database.`,
          dbError
        );
        // Optionally, return a 500 error to have Stripe retry the webhook
        return response.status(500).json({ error: "Database update failed." });
      }
    } else {
      console.error(
        `Webhook Error: bookingId not found in payment_intent.succeeded metadata. PaymentIntent ID: ${paymentIntent.id}`
      );
    }
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.json({ received: true });
};

export default stripeWebhooks;
