import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/api";

// Helper function to decode JWT token (without verification on client)
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: true, // Important for cookies
});

let activeSocketUserId = null;

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

// Connect AFTER login with the JWT token
export const connectSocket = (userId) => {
  // Try to get token from multiple sources
  // 1. First check localStorage (set during login)
  let token = localStorage.getItem("USER_AUTH_TOKEN");

  // 2. If not in localStorage, try to extract from cookie (for httpOnly fallback)
  if (!token) {
    token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_token="))
      ?.split("=")[1];
  }

  // If still no token, try to decode from userId
  if (!token && userId) {
    const userKey = String(userId);
    if (socket.connected && activeSocketUserId === userKey) return;
    if (socket.connected) socket.disconnect();

    console.warn("No token found, connecting with userId only");
    activeSocketUserId = userKey;
    socket.auth = { userId };
    socket.connect();
    return;
  }

  if (!token) {
    console.error("No token found, cannot connect socket");
    return;
  }

  // If we have a token but no userId, decode it
  let finalUserId = userId;
  if (!finalUserId) {
    const decoded = decodeToken(token);
    finalUserId = decoded?.id;
  }

  if (!finalUserId) {
    console.error("Could not extract userId from token");
    return;
  }

  const userKey = String(finalUserId);
  if (socket.connected && activeSocketUserId === userKey) return;
  if (socket.connected) socket.disconnect();

  // Send both token AND userId for authentication
  activeSocketUserId = userKey;
  socket.auth = { token, userId: finalUserId };
  socket.connect();
};

export const disconnectSocket = () => {
  activeSocketUserId = null;
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;