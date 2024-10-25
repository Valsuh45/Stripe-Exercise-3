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

  // Function to create the Setup session
  const handleSetup = async () => {
    const response = await fetch("/create-setup-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerEmail: "customer@example.com", // Replace with actual customer email if available
      }),
    });

    const { sessionId, error } = await response.json();
    if (error) {
      console.error("Error creating session:", error.message);
      return;
    }

    const stripe = await stripePromise;
    // Redirect to Checkout
    const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
    if (redirectError) {
      console.error("Error redirecting to Checkout:", redirectError);
    }
  };

  return (
    <>
      <h1>Setup Payment Method for Future Charges</h1>
      {stripePromise && (
        <button onClick={handleSetup}>Save Payment Method</button>
      )}
    </>
  );
}

export default Payment;
