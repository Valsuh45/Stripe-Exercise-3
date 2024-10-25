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

const pricesByCurrency = {
  usd: { amount: 1000, currency: 'usd' }, // $10.00
  eur: { amount: 900, currency: 'eur' },  // €9.00
  gbp: { amount: 800, currency: 'gbp' },  // £8.00
};

// Create a subscription session with trial period and multi-currency support
app.post("/create-subscription-session", async (req, res) => {
  const { currency } = req.body;

  try {
    // Create a product for subscription
    const product = await stripe.products.create({
      name: 'Custom Subscription Product',
      description: 'Multi-currency subscription product with trial period',
    });

    // Get the correct price based on currency
    const priceData = pricesByCurrency[currency] || pricesByCurrency['usd'];

    const price = await stripe.prices.create({
      unit_amount: priceData.amount,
      currency: priceData.currency,
      recurring: { interval: 'month' }, // Monthly subscription
      product: product.id,
    });

    // Create a checkout session for the subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      
      // Set trial period and payment collection
      payment_method_collection: 'always', // Collect payment method even if not charged immediately
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          order_id: '12345',
        },
      },
    });

    // Send the session ID to the client
    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.error("Error creating subscription session:", e.message);
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