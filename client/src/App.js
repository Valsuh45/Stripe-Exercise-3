import "./App.css";
import Payment from "./Payment";
import Completion from "./Completion";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <main>
      <BrowserRouter basename="/Stripe-Exercise-3">
        <Routes>
          <Route path="/" element={<Payment />} />
          <Route path="/completion" element={<Completion />} />
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export default App;
