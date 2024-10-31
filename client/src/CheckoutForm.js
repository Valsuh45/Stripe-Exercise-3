import { useState } from "react";

export default function CheckoutForm() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);

    try {
      // Request the server to create a Checkout Session
      const response = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "usd", 
          customerEmail: customerEmail,
        }),
      });

      const data = await response.json();
      if (data.url) {
        // Redirect the client to the Checkout page
        window.location.href = data.url;
      } else {
        console.error("Error creating Checkout Session:", data);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button disabled={isProcessing} onClick={handleClick}>
      {isProcessing ? "Processing..." : "Checkout"}
    </button>
  );
}