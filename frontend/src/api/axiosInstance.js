import axios from "axios";
import { useAuthStore } from "../store/authStore";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach access token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

// Auto refresh expired access token
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse =
          await axios.post(
            "http://localhost:5000/api/auth/refresh",
            {},
            {
              withCredentials: true,
            }
          );

        const newAccessToken =
          refreshResponse.data.accessToken;

        useAuthStore.setState({
          accessToken: newAccessToken,
        });

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);

      } catch (refreshError) {
        useAuthStore
          .getState()
          .clearAuth();

        window.location.href =
          "/login";

        return Promise.reject(
          refreshError
        );
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;