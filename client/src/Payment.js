import { useEffect, useState } from "react";

function Payment() {
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  useEffect(() => {
    // Create the Checkout session when the component loads
    const createCheckoutSession = async () => {
      try {
        const response = await fetch("/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currency: 'usd',  // Example data; set according to your requirement
            customerEmail: 'customer@example.com'
          }),
        });
        
        const data = await response.json();
        setCheckoutUrl(data.url); // Save the checkout URL for redirection
      } catch (error) {
        console.error("Error creating Checkout Session:", error);
      }
    };

    createCheckoutSession();
  }, []);

  // Handle redirection to the Checkout page
  const handleCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl; // Redirect directly to the checkout URL
    }
  };

  return (
    <>
      <h1>React Stripe Checkout Example</h1>
      <button onClick={handleCheckout}>Go to Checkout</button>
    </>
  );
}

export default Payment;
