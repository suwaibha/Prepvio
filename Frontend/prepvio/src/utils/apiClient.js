import axios from "axios";
import { MAIN_API_URL, CONTENT_API_URL } from "../config/api";

export const mainApi = axios.create({
  baseURL: MAIN_API_URL,
  withCredentials: true,
});

export const contentApi = axios.create({
  baseURL: CONTENT_API_URL,
  withCredentials: true,
});

// Request interceptor to attach JWT token if available in local storage
const authInterceptor = (config) => {
  const token = localStorage.getItem("USER_AUTH_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['Authorization'] = `Bearer ${token}`;
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  } else {
    // Explicitly delete headers if token is not present (to prevent stale header issues)
    delete config.headers.Authorization;
    delete config.headers['Authorization'];
    if (config.headers.delete) {
      config.headers.delete('Authorization');
    }
  }
  return config;
};

mainApi.interceptors.request.use(authInterceptor);
contentApi.interceptors.request.use(authInterceptor);

