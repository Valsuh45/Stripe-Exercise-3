const express = require("express");
const app = express();
const { resolve } = require("path");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.use(express.static(process.env.STATIC_DIR)); // Make sure this is pointing to the ngrok URL

// Serve static HTML
app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR);
  res.sendFile(path);
});

// Send Stripe publishable key
app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Create Checkout Session
app.post("/create-checkout-session", express.json(), async (req, res) => {
  try {
    const product = await stripe.products.create({
      name: "Custom Product",
      description: "Multi-currency product",
    });

    const price = await stripe.prices.create({
      unit_amount: 1000,
      currency: "EUR",
      product: product.id,
    });

    const sessionConfig = {
      payment_method_types: ["card", "sepa_debit"], // Includes Apple Pay and Google Pay
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 180,

      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true,
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating Checkout Session:", error.message);
    res.status(400).send({
      error: { message: error.message, requestId: error.requestId },
    });
  }
});

// Webhook endpoint for handling events
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Stripe events
  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("Payment succeeded!");
      break;
    case "payment_intent.processing":
      console.log("Payment processing...");
      break;
    case "payment_intent.payment_failed":
      console.log("Payment failed.");
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Start the server
app.listen(5252, () => console.log(`Server running at http://localhost:5252`));
