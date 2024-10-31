import { useEffect, useState } from "react";

function Payment() {
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  useEffect(() => {
    // Function to create a new Checkout Session
    const createCheckoutSession = async () => {
      try {
        console.log("Creating Checkout Session..."); // Log function call for tracking

        // Request to create a Checkout Session on the server
        const response = await fetch("/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currency: 'usd',  // Currency to be used in the session
          }),
        });
        
        const data = await response.json();
        setCheckoutUrl(data.url); // Save the checkout URL for redirection
        console.log("Checkout URL received:", data.url); // Log received URL
      } catch (error) {
        console.error("Error creating Checkout Session:", error); // Log error if creation fails
      }
    };

    createCheckoutSession(); // Execute the function when the component loads
  }, []);

  // Handle redirection to the Checkout page
  const handleCheckout = () => {
    if (checkoutUrl) {
      console.log("Redirecting to Checkout URL:", checkoutUrl); // Log redirection
      window.location.href = checkoutUrl; // Redirect to the checkout URL
    } else {
      console.warn("Checkout URL not available yet."); // Warn if URL is not set
    }
  };

  return (
    <>
      <h1>React Stripe Checkout Example</h1>
      <button onClick={handleCheckout}>Go to Checkout</button> {/* Button triggers the handleCheckout function */}
    </>
  );
}

export default Payment;
