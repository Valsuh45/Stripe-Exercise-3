import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

function Payment() {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Fetch the publishable key from the server
    fetch("/config").then(async (r) => {
      const { publishableKey } = await r.json();
      setStripePromise(loadStripe(publishableKey));
    });
  }, []);

  // Function to create the Checkout session
  const handleCheckout = async () => {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    const { sessionId } = await response.json();
    const stripe = await stripePromise;

    // Redirect to Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error("Error redirecting to Checkout:", error);
    }
  };

  return (
    <>
      <h1>React Stripe Checkout Example</h1>
      {stripePromise && (
        <button onClick={handleCheckout}>Go to Checkout</button>
      )}
    </>
  );
}

export default Payment;