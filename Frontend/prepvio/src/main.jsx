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
