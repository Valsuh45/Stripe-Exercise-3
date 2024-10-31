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

    // Create a product on Stripe
    const product = await stripe.products.create({
      name: 'Custom Product',
      description: 'Multi-currency product',
    });
    console.log("Product created:", product.id);

    // Create a price for the created product
    const price = await stripe.prices.create({
      unit_amount: 1000,
      currency: 'eur',
      product: product.id,
    });
    console.log("Price created:", price.id);

    // Pre-defined shipping rate IDs (these should be created in Stripe Dashboard or via API beforehand)
    const shippingRateIds = [
      "shr_1QFzc5Hcq0BpKt6rDvnFMpTI", // replace with actual ID from your Stripe account
      "shr_1QFzdHHcq0BpKt6rxvAc7STP"   // replace with actual ID from your Stripe account
    ];

    const sessionConfig = {
      payment_method_types: ['card', 'eps'],
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
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",

      // Enable shipping address collection
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB'], // specify countries where you want to ship
      },

      // Define shipping options using pre-existing Shipping Rate objects
      shipping_options: shippingRateIds.map(id => ({ shipping_rate: id }))
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
