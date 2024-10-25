const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
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

// Endpoint to create Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  const { currency, customerEmail } = req.body;

  try {
    // Create a product
    const product = await stripe.products.create({
      name: 'Custom Product',
      description: 'Multi-currency product',
    });

    // Create a recurring price for subscription
    const price = await stripe.prices.create({
      unit_amount: 1000, // Example amount (in smallest currency unit, e.g., cents)
      currency: currency || 'usd',
      product: product.id,
      recurring: { interval: 'month' } // Define as a recurring monthly subscription
    });

    // Check if we have a customerEmail to pass as the customer
    let customerId = null;
    if (customerEmail) {
      // Check if an existing customer already exists for the provided email
      const customer = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });
      if (customer.data.length) {
        customerId = customer.data[0].id;
      }
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Subscription mode for recurring payments
      customer: customerId || undefined, // Scenario: If customer is not provided, Stripe will create a new Customer
      customer_email: !customerId ? customerEmail : undefined, // For guest customer use if no existing customer
      subscription_data: {
        metadata: { order_id: '12345' },
      },
      payment_method_collection: 'if_required',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    };
    
    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (session.customer) {
    } else {
  
    }

    // Send the URL to the client
    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating Checkout Session:", error.message);
    res.status(400).send({
      error: { message: error.message, requestId: error.requestId },
    });
  }
});

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);
