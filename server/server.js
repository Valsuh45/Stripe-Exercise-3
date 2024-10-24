const express = require("express");
const app = express();
const { resolve } = require("path");
// Replace if using a different env file or config
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

// NEW FUNCTIONALITY: Checkout Session for "pay what you want" pricing and multi-currency
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("Starting to create Checkout Session...");

    // Create a product
    const product = await stripe.products.create({
      name: 'Custom Product', // Can customize product name/description
      description: 'This product supports custom pricing',
    });

    console.log("Product created:", product);

    // Pay What You Want (Custom Amount) Pricing Model
    const price = await stripe.prices.create({
      currency: 'eur', // Base currency
      custom_unit_amount: {
        enabled: true, // Enables customer to specify amount
        minimum: 500,  // Minimum price (in cents)
        maximum: 5000, // Maximum price (in cents)
      },
      product: product.id, // Use the product created above
    });

    console.log("Price created with custom_unit_amount:", price);

    // Create a Checkout Session with multi-currency support (example only for EUR)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Adjust as needed
      line_items: [
        {
          price: price.id, // Use Price object created with custom_unit_amount
          quantity: 1,
        },
      ],
      mode: 'payment', // 'payment' for one-time purchase
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    console.log("Checkout Session created:", session);

    // Send the session ID to the client
    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.error("Error creating Checkout Session:", e.message);
    return res.status(400).send({
      error: {
        message: e.message,
        requestId: e.requestId, // Log request ID for debugging
      },
    });
  }
});

// New Payment Intent endpoint
// app.post("/create-payment-intent", async (req, res) => {
//   try {
//     const { amount, currency, description, receipt_email } = req.body;

//     // Create a Payment Intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount, // Amount in cents
//       currency: currency, // Currency
//       description: description || 'Payment for product',
//       receipt_email: receipt_email || '', // Optional email for the receipt
//       // You can add more options here if needed
//     });

//     // Send the Payment Intent details back to the client
//     res.send({
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//     });
//   } catch (e) {
//     return res.status(400).send({
//       error: {
//         message: e.message,
//       },
//     });
//   }
// });


app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);