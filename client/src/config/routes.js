// Client-side route paths
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  RESET_PASSWORD: "/reset-password",
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
    RESET_PASSWORD: "/auth/reset-password",
  },
};

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
};

const getDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }

  return "/api";
};

// API Base URL
export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.REACT_APP_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    getDefaultApiBaseUrl(),
);
