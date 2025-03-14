import { useEffect, useState } from "react";

function Payment() {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        const response = await fetch("https://hosted1.onrender.com/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currency: 'usd',
          }),
        });
        
        const data = await response.json();
        if (data.url) {
          setCheckoutUrl(data.url);
        } else {
          setError("Failed to create Checkout Session");
        }
      } catch (error) {
        console.error("Error creating Checkout Session:", error);
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, []);

  const handleCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <>
      <h1>MagicWorld Park</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <button onClick={handleCheckout}>Book a ticket</button>
      )}
    </>
  );
}

export default Payment;
