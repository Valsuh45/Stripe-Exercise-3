const express = require("express");
const app = express();
const { resolve } = require("path");
// Replace if using a different env file or config
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

// Define standard prices for each currency
const pricesByCurrency = {
  usd: { amount: 1000, currency: 'usd' }, // $10.00
  eur: { amount: 900, currency: 'eur' },  // €9.00
  gbp: { amount: 800, currency: 'gbp' },  // £8.00
};

// Create a checkout session with multi-currency support
app.post("/create-checkout-session", async (req, res) => {
  const { currency } = req.body; // Receive the currency from client-side

  try {
    console.log("Starting to create Checkout Session...");

    // Create a product
    const product = await stripe.products.create({
      name: 'Custom Product',
      description: 'Multi-currency product',
    });

    console.log("Product created:", product);

    // Get the correct price based on currency
    const priceData = pricesByCurrency[currency] || pricesByCurrency['usd']; // Default to USD if no currency provided

    const price = await stripe.prices.create({
      unit_amount: priceData.amount, // Use the amount for the selected currency
      currency: priceData.currency,  // Set the currency
      product: product.id, // Link to the product
    });

    console.log("Price created:", price);

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id, // Use the price created above
          quantity: 1,
        },
      ],
      mode: 'payment',
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
        requestId: e.requestId,
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