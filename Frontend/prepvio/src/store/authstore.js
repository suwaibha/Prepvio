// src/store/authstore.js
import { create } from "zustand";
import { mainApi, contentApi } from "../utils/apiClient";

const API_URL = "/auth";

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,

    setupInterceptor: () => {
        // Prevent registering interceptors multiple times
        if (useAuthStore.__interceptorsRegistered) return;
        useAuthStore.__interceptorsRegistered = true;

        const handleUnauthorized = (error) => {
            if (error.response?.status === 401) {
                const requestUrl = error.config?.url || "";

                // Don't wipe token for check-auth — it's expected to 401
                // when no valid session exists (e.g. first load, after logout)
                const isCheckAuth = requestUrl.includes("/check-auth");
                if (isCheckAuth) {
                    return Promise.reject(error);
                }

                console.error("401 Unauthorized - Logging out");
                localStorage.removeItem("USER_AUTH_TOKEN");
                set({ user: null, isAuthenticated: false });

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        };
        mainApi.interceptors.response.use((response) => response, handleUnauthorized);
        contentApi.interceptors.response.use((response) => response, handleUnauthorized);
    },

    signup: async (email, password, name) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const response = await mainApi.post(`${API_URL}/signup`, { email, password, name });
            set({
                user: response.data?.user || null,
                isAuthenticated: false,  // Not authenticated until verified
                isLoading: false,
                message: response.data?.message || ""
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error signing up",
                isLoading: false
            });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const response = await mainApi.post(`${API_URL}/login`, { email, password });

            // Store user-specific token
            if (response.data?.token) {
                localStorage.setItem("USER_AUTH_TOKEN", response.data.token);
            }
            set({
                isAuthenticated: true,
                user: response.data?.user || null,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error logging in",
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await mainApi.post(`${API_URL}/logout`);
            // Clear local user session
            localStorage.removeItem("USER_AUTH_TOKEN");
            set({
                user: null,
                isAuthenticated: false,
                error: null,
                isLoading: false
            });
        } catch (error) {
            set({ error: "Error logging out", isLoading: false });
            throw error;
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await mainApi.post(`${API_URL}/verify-email`, { code });
            if (response.data?.token) {
                localStorage.setItem("USER_AUTH_TOKEN", response.data.token);
            }
            set({
                user: response.data?.user || null,
                isAuthenticated: true,  // Now authenticated after verification
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error verifying email",
                isLoading: false
            });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });

        try {
            const response = await mainApi.get(`${API_URL}/check-auth`);
            if (!response.data || typeof response.data !== "object" || !response.data.user) {
                throw new Error("Invalid check-auth response structure");
            }

            set({
                user: response.data.user,
                isAuthenticated: true,
                isCheckingAuth: false,
            });
        } catch (error) {
            console.log("checkAuth failed (expected if not logged in)", error.message || error);
            set({
                user: null,
                isAuthenticated: false,
                isCheckingAuth: false,
                error: null,
            });
        }
    },

    refreshUser: async () => {
        try {
            const response = await mainApi.get(`${API_URL}/check-auth`);
            set({ user: response.data?.user || null });
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const response = await mainApi.post(`${API_URL}/forgot-password`, { email });
            set({ message: response.data?.message || "", isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || "Error sending reset password email",
            });
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await mainApi.post(`${API_URL}/reset-password/${token}`, { password });
            set({ message: response.data?.message || "", isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || "Error resetting password",
            });
            throw error;
        }
    },

    clearMessage: () => set({ message: null, error: null }),
}));
