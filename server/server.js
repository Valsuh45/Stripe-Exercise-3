const express = require("express");
const cors = require("cors");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(cors()); // Enable CORS for all origins (for development purposes)
app.use(express.json());
app.use(express.static(process.env.STATIC_DIR));

// Serve the static index file
app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

// Send Stripe publishable key to the client
app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Endpoint to create a Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("Request received to create Checkout Session");

    // Create a product on Stripe
    const product = await stripe.products.create({
      name: 'Custom Product',
      description: 'Multi-currency product',
    });
    console.log("Product created:", product.id); // Log product ID for debugging

    // Create a price for the created product
    const price = await stripe.prices.create({
      unit_amount: 1000, // Example amount in smallest currency unit, e.g., cents
      currency: 'usd',
      product: product.id,
    });
    console.log("Price created:", price.id); // Log price ID for debugging

    // Configure the Checkout Session with automatic tax and tax ID collection
    const sessionConfig = {
      payment_method_types: ['card', 'eps'], // Available payment methods

      // Define line items with the created price
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment', // Set mode to 'payment' for a one-time purchase

      // URLs to redirect after successful or canceled payment
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      
      // Enable Stripe's automatic tax calculation
      automatic_tax: { enabled: true },

      // Enable tax ID collection in the session
      tax_id_collection: { enabled: true },

      // Implemented features:

      // 1. Enable phone number collection
      phone_number_collection: { enabled: true }, // <--- Enabling phone number collection

      // 2. Make billing address required
      billing_address_collection: "required", // <--- Making billing address required

      // 3. Collect a shipping address
      shipping_address_collection: { allowed_countries: ["US", "CA", "DE"] }, // <--- Collecting shipping address

      // 4. Set up shipping options (here as an example)
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Standard Shipping",
            type: "fixed_amount",
            fixed_amount: { amount: 500, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            display_name: "Express Shipping",
            type: "fixed_amount",
            fixed_amount: { amount: 1500, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ], // 
    };

    console.log("Checkout Session config:", sessionConfig);

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Checkout Session created:", session.id); // Log session ID

    // Send the Checkout URL to the client
    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating Checkout Session:", error.message);
    res.status(400).send({
      error: { message: error.message, requestId: error.requestId },
    });
  }
});

// Start the server and log the listening port
app.listen(5252, () =>
  console.log("Node server listening at http://localhost:5252")
);
