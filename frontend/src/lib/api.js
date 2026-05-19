import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60000,
});

// Attach Bearer token from localStorage as backup (in case cookies are blocked by browser)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb_session_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // Will be handled by AuthContext
    }
    return Promise.reject(err);
  }
);
