const express = require("express");
const cors = require("cors");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(cors());
app.use(express.json());
app.use(express.static(process.env.STATIC_DIR));

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("Request received to create Checkout Session");

    // Use pre-existing price ID and product ID
    const priceId = 'price_1QEumNHcq0BpKt6rduobTtcV'; // Replace with your actual price ID from Stripe

    // Pre-defined shipping rate IDs (created in the Stripe Dashboard or API beforehand)
    // const shippingRateIds = [
    //   "shr_1QFzc5Hcq0BpKt6rDvnFMpTI", // replace with actual ID from your Stripe account
    //   "shr_1QFzdHHcq0BpKt6rxvAc7STP"   // replace with actual ID from your Stripe account
    // ];

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",

      // Enable shipping address collection
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'DE'], // specify countries where you want to ship
      },

      // Define shipping options using pre-existing Shipping Rate objects
      // shipping_options: shippingRateIds.map(id => ({ shipping_rate: id })),

      // Allow customers to enter a promotion code
      allow_promotion_codes: true,  // <--- This enables the promo code field on the checkout page
    };

    console.log("Checkout Session config:", sessionConfig);

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Checkout Session created:", session.id);

    // Send the Checkout URL to the client
    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating Checkout Session:", error.message);
    res.status(400).send({
      error: { message: error.message, requestId: error.requestId },
    });
  }
});

app.listen(5252, () =>
  console.log("Node server listening at http://localhost:5252")
);
