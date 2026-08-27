// ─── Stale Service Worker Cleanup ───────────────────────────────────────────
// There is no service worker in this codebase. Any registered SW is from a
// previous production build and will intercept Vite HMR + Razorpay scripts.
// Unregister all of them immediately before the app boots.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister().then((removed) => {
        if (removed) {
          console.info('[SW Cleanup] Unregistered stale service worker:', reg.scope);
        }
      });
    }
  }).catch((err) => {
    console.warn('[SW Cleanup] Could not query service worker registrations:', err);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { MAIN_BACKEND_URL, CONTENT_BACKEND_URL } from "./config/api";

// Relative /api requests are sent to the deployed main backend in every mode.
axios.defaults.baseURL = MAIN_BACKEND_URL;
axios.defaults.withCredentials = true;

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === "string") {
    if (
      input.startsWith("/api/services") ||
      input.startsWith("/api/courses") ||
      input.startsWith("/api/aptitude") ||
      input.startsWith("/api/categories") ||
      input.startsWith("/api/dashboard") ||
      input.startsWith("/api/channels") ||
      input.startsWith("/api/playlists") ||
      input.startsWith("/api/quizzes") ||
      input.startsWith("/api/videos") ||
      input.startsWith("/api/projects")
    ) {
      return nativeFetch(`${CONTENT_BACKEND_URL}${input}`, init);
    } else if (input.startsWith("/api") || input.startsWith("/run")) {
      return nativeFetch(`${MAIN_BACKEND_URL}${input}`, init);
    }
  }

  return nativeFetch(input, init);
};

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
