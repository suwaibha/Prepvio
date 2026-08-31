const withoutTrailingSlash = (url = "") => url.replace(/\/+$/, "");

export const MAIN_API_URL = withoutTrailingSlash(import.meta.env.VITE_MAIN_API_URL);
export const CONTENT_API_URL = withoutTrailingSlash(import.meta.env.VITE_CONTENT_API_URL);
export const MAIN_BACKEND_URL = withoutTrailingSlash(import.meta.env.VITE_MAIN_BACKEND_URL);
export const CONTENT_BACKEND_URL = withoutTrailingSlash(import.meta.env.VITE_CONTENT_BACKEND_URL);
export const SOCKET_URL = withoutTrailingSlash(import.meta.env.VITE_SOCKET_URL);

export const FIREWORKS_API_KEY = "fw_7BzcUEoGttTnGfZhE6dQ96";
export const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
export const PROCTOR_API_URL = "http://127.0.0.1:5050";
