// config/plans.js
export const PLANS = {
  free: {
    name: "Free Plan",
    amount: 0,
    duration: "lifetime",
    interviews: 0,
  },
  monthly: { // 👈 Changed from "basic" to "monthly"
    name: "Basic Plan",
    amount: 79,
    duration: "monthly",
    interviews: 4,
  },
  premium: {
    name: "Pro Access",
    amount: 179,
    duration: "monthly",
    interviews: 9,
  },
  yearly: {
    name: "Premium Plan",
    amount: 499,
    duration: "monthly",
    interviews: 25,
  },
};