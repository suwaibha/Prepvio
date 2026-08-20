const withoutTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const isLocalHost =
  typeof window !== "undefined" && LOCAL_HOSTNAMES.has(window.location.hostname);

const readApiUrl = (envUrl, localUrl) =>
  withoutTrailingSlash(isLocalHost ? localUrl : envUrl);

export const MAIN_API_URL = readApiUrl(
  import.meta.env.VITE_MAIN_API_URL,
  "http://localhost:5000/api"
);
export const CONTENT_API_URL = readApiUrl(
  import.meta.env.VITE_CONTENT_API_URL,
  "http://localhost:8000/api"
);
export const MAIN_BACKEND_URL = readApiUrl(
  import.meta.env.VITE_MAIN_BACKEND_URL,
  "http://localhost:5000"
);
export const CONTENT_BACKEND_URL = readApiUrl(
  import.meta.env.VITE_CONTENT_BACKEND_URL,
  "http://localhost:8000"
);
export const SOCKET_URL = readApiUrl(
  import.meta.env.VITE_SOCKET_URL,
  "http://localhost:5000"
);
