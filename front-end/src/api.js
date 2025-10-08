// Makes API requests to backend
import axios from "axios";
import { getAuth } from "firebase/auth"; // <-- add this

export const api = axios.create({
  baseURL: "/api",
});

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const user = getAuth().currentUser; // requires Firebaseto be initialized already
      if (user) {
        const token = await user.getIdToken();
        config.headers = config.headers || {};
        config.headers.authtoken = token; // backend expects header named 'authtoken' with the token

        config.headers.authorization = `Bearer ${token}`;// if backend expects 'Authorization' header
      }
    } catch (_) {
      // If NO token just send request without it
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api; 