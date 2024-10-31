const express = require("express");
const cors = require("cors"); // Add CORS
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
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
    console.log("Product created:", product.id);

    // Create a price for the created product
    const price = await stripe.prices.create({
      unit_amount: 1000,
      currency: 'usd',
      product: product.id,
    });
    console.log("Price created:", price.id);

    // Configure the Checkout Session with automatic tax and tax ID collection
    const sessionConfig = {
      payment_method_types: ['card', 'eps'], 

      // Define line items with the created price
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',

      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },

      // Enable phone number collection
      // This will prompt users to enter their phone number at checkout
      phone_number_collection: { enabled: true }, // <-- Enabled phone number collection

      // Require billing address collection
      // This will make billing address mandatory in the Checkout Session
      billing_address_collection: "required", // <-- Make billing address required
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
