import { useEffect } from "react";

function Payment() {
  // Assume user data is available here for demo purposes
  const user = { id: "user_123", email: "customer@example.com" };
  
  // Construct the client reference ID dynamically
  const clientReferenceId = `user_${user.id}`;

  useEffect(() => {
    const loadStripeScript = () => {
      // Load the Stripe Pricing Table script
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      document.body.appendChild(script);
    };

    loadStripeScript();
  }, []);

  return (
    <div>
      <h1>Stripe Pricing Table Integration</h1>

      {/* Embed the Stripe Pricing Table with dynamic attributes */}
      <stripe-pricing-table
        pricing-table-id="prctbl_1QGFTZHcq0BpKt6rNZIVzXzh"
        publishable-key="pk_test_51QAtlmHcq0BpKt6rHQYZWe68fRkI5jUGdUe7SQp12DF7gEYFj9AlD7QtTJIAIefjCwSByqTtEfjf21R494ntopyY00s2wZT5yV"
       customer-email={user.email}  // Pre-fill email dynamically
       client-reference-id={clientReferenceId}  // Set the client reference ID
      ></stripe-pricing-table>
    </div>
  );
}

export default Payment;
