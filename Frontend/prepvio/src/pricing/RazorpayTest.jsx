import { useState } from "react";
import { mainApi } from "../utils/apiClient";

function RazorpayTest() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Plan details
  const plans = {
    monthly: { name: "Basic Plan", price: 79, interviews: 4 },
    premium: { name: "Pro Access", price: 179, interviews: 9 },
    yearly: { name: "Premium Plan", price: 499, interviews: 25 },
  };

  // Validate promo code
  async function validatePromoCode(planId) {
    if (!promoCode.trim()) {
      setPromoValidation(null);
      return;
    }

    console.log("Validating promo code:", promoCode, "for plan:", planId);
    setIsValidating(true);
    try {
      const { data } = await mainApi.post(
        "/promo/validate",
        { code: promoCode, planId }
      );

      console.log("Validation response:", data);
      if (data.valid) {
        setPromoValidation({
          valid: true,
          ...data.pricing,
          code: data.promoCode.code,
          description: data.promoCode.description,
        });
      }
    } catch (err) {
      console.error("Validation error:", err);
      setPromoValidation({
        valid: false,
        message: err.response?.data?.message || "Invalid promo code",
      });
    } finally {
      setIsValidating(false);
    }
  }

  // Handle payment with optional promo code
  async function handlePaymentWithPlan(planId) {
    try {
      const requestData = { planId };
      if (promoCode.trim() && promoValidation?.valid) {
        requestData.promoCode = promoCode;
      }

      console.log("Creating order with data:", requestData);
      const { data } = await mainApi.post(
        "/payment/create-order",
        requestData
      );

      console.log("Order created:", data);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Prepvio AI",
        description: `${data.planName} - ${data.interviews} Interviews`,
        handler: async function (response) {
          try {
            const verifyRes = await mainApi.post(
              "/payment/verify",
              response
            );

            if (verifyRes.data.success) {
              let message = `✅ Payment verified!\n` +
                `Plan: ${verifyRes.data.subscription.planName}\n` +
                `🎤 Interviews Remaining: ${verifyRes.data.interviews.remaining}`;

              if (verifyRes.data.promoApplied) {
                message += `\n\n💰 Promo Applied: ${verifyRes.data.promoApplied.code}\n` +
                  `Discount: ₹${verifyRes.data.promoApplied.discountAmount}\n` +
                  `You saved ₹${verifyRes.data.promoApplied.discountAmount}!`;
              }

              alert(message);

              // Reset promo code after successful payment
              setPromoCode("");
              setPromoValidation(null);
              setSelectedPlan(null);
            }
          } catch (err) {
            console.error(err);
            alert("Verification failed");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#1A1A1A",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.response?.data?.message || "Payment failed");
    }
  }

  // Select a plan and show promo input
  function selectPlan(planId) {
    console.log("Plan selected:", planId);
    setSelectedPlan(planId);
    setPromoValidation(null);
    setPromoCode(""); // Reset promo code when selecting new plan
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "30px", color: "#333" }}>
        💳 Payment with Promo Code
      </h2>

      {!selectedPlan ? (
        <div>
          <h3 style={{ marginBottom: "20px", color: "#555" }}>Select a Plan:</h3>
          {Object.entries(plans).map(([id, plan]) => (
            <button
              key={id}
              onClick={() => selectPlan(id)}
              style={{
                display: "block",
                margin: "10px 0",
                padding: "20px",
                width: "100%",
                cursor: "pointer",
                backgroundColor: "#1A1A1A",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.target.style.transform = "scale(1)"}
            >
              {plan.name} - ₹{plan.price} ({plan.interviews} Interviews)
            </button>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "12px", border: "2px solid #e0e0e0" }}>
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Selected Plan: {plans[selectedPlan].name}
            </h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0", color: "#1A1A1A" }}>
              ₹{plans[selectedPlan].price}
            </p>
          </div>

          {/* Promo Code Input - HIGHLIGHTED */}
          <div style={{
            marginTop: "25px",
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "2px dashed #4CAF50"
          }}>
            <label style={{
              display: "block",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "16px",
              color: "#333"
            }}>
              🎁 Have a promo code?
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  console.log("Promo code input changed:", value);
                  setPromoCode(value);
                  setPromoValidation(null);
                }}
                onFocus={(e) => {
                  console.log("Input focused");
                  e.target.style.borderColor = "#4CAF50";
                }}
                onBlur={(e) => e.target.style.borderColor = "#ccc"}
                placeholder="Enter PREP29"
                autoComplete="off"
                style={{
                  flex: 1,
                  padding: "12px 15px",
                  border: "2px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
              <button
                onClick={() => validatePromoCode(selectedPlan)}
                disabled={!promoCode.trim() || isValidating}
                style={{
                  padding: "12px 25px",
                  backgroundColor: promoCode.trim() ? "#4CAF50" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: promoCode.trim() ? "pointer" : "not-allowed",
                  fontSize: "16px",
                  fontWeight: "bold",
                  minWidth: "100px",
                }}
              >
                {isValidating ? "Checking..." : "Apply"}
              </button>
            </div>

            {/* Promo Validation Message */}
            {promoValidation && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "6px",
                  backgroundColor: promoValidation.valid ? "#d4edda" : "#f8d7da",
                  color: promoValidation.valid ? "#155724" : "#721c24",
                  border: `2px solid ${promoValidation.valid ? "#c3e6cb" : "#f5c6cb"}`,
                }}
              >
                {promoValidation.valid ? (
                  <div>
                    <strong style={{ fontSize: "16px" }}>✅ {promoValidation.code} Applied!</strong>
                    <p style={{ margin: "8px 0", fontSize: "14px" }}>{promoValidation.description}</p>
                    <div style={{ marginTop: "12px", fontSize: "15px" }}>
                      <div style={{ marginBottom: "5px" }}>
                        <span style={{ textDecoration: "line-through", color: "#666" }}>
                          Original: ₹{promoValidation.originalAmount}
                        </span>
                      </div>
                      <div style={{ color: "#28a745", fontWeight: "bold", marginBottom: "5px" }}>
                        Discount: -₹{promoValidation.discountAmount}
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#155724" }}>
                        Final Amount: ₹{promoValidation.finalAmount}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "15px" }}>❌ {promoValidation.message}</div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
            <button
              onClick={() => handlePaymentWithPlan(selectedPlan)}
              style={{
                flex: 1,
                padding: "18px",
                backgroundColor: "#1A1A1A",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "bold",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#333"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#1A1A1A"}
            >
              {promoValidation?.valid
                ? `💳 Pay ₹${promoValidation.finalAmount}`
                : `💳 Pay ₹${plans[selectedPlan].price}`}
            </button>
            <button
              onClick={() => {
                console.log("Going back to plan selection");
                setSelectedPlan(null);
                setPromoCode("");
                setPromoValidation(null);
              }}
              style={{
                padding: "18px 30px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ← Back
            </button>
          </div>

          {/* Sample Promo Codes */}
          <div style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffc107"
          }}>
            <strong style={{ color: "#856404", fontSize: "14px" }}>💡 Try these sample codes:</strong>
            <ul style={{ margin: "10px 0 0 0", paddingLeft: "20px", color: "#856404" }}>
              <li style={{ marginBottom: "5px" }}>
                <code style={{ backgroundColor: "#fff", padding: "2px 6px", borderRadius: "3px" }}>WELCOME10</code> - 10% off
              </li>
              <li style={{ marginBottom: "5px" }}>
                <code style={{ backgroundColor: "#fff", padding: "2px 6px", borderRadius: "3px" }}>SAVE50</code> - ₹50 off
              </li>
              <li>
                <code style={{ backgroundColor: "#fff", padding: "2px 6px", borderRadius: "3px" }}>PREMIUM20</code> - 20% off (Premium/Yearly only)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default RazorpayTest;
