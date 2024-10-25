const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

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

// Set up future payments without immediate charge
app.post("/create-checkout-session", async (req, res) => {
  const { currency, customerEmail } = req.body;

  try {
    console.log("Starting to create Subscription Checkout Session...");

    // Create a product (reuse or store product ID in a real implementation)
    const product = await stripe.products.create({
      name: 'Custom Subscription Product',
      description: 'Multi-currency subscription product',
    });

    console.log("Product created:", product);

    // Get the correct price based on currency
    const priceData = pricesByCurrency[currency] || pricesByCurrency['usd']; // Default to USD if no currency provided

    const price = await stripe.prices.create({
      unit_amount: priceData.amount,
      currency: priceData.currency,
      recurring: { interval: 'month' }, // Monthly subscription
      product: product.id,
    });

    console.log("Price created:", price);

    // Set up URLs
    const successUrl = process.env.SUCCESS_URL || "http://localhost:4242/success.html";
    const cancelUrl = process.env.CANCEL_URL || "http://localhost:4242/cancel.html";

    // Create a subscription Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail,
      subscription_data: {
        trial_period_days: 14, // Optional free trial period
        metadata: {
          customer_email: customerEmail,
          order_id: '12345'
        },
      },
      payment_method_collection: 'if_required', // Optional: collect payment only if required
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("Subscription Checkout Session created:", session);

    // Send the session ID to the client
    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.error("Error creating Subscription Checkout Session:", e.message);
    return res.status(400).send({
      error: {
        message: e.message,
        requestId: e.requestId,
      },
    });
  }
});


app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);
