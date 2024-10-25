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
app.post("/create-setup-session", async (req, res) => {
  const { customerEmail } = req.body;

  try {
    // Create a checkout session in setup mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup', // Setting up for future payments
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      
      // Set additional metadata and setup intent parameters
      setup_intent_data: {
        metadata: {
          customer_email: customerEmail, // Store customer email
          purpose: 'Future off-session charges', // Example metadata
          order_id: '12345', // Additional metadata
        }
      }
    });

    // Send the session ID to the client
    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.error("Error creating setup session:", e.message);
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
