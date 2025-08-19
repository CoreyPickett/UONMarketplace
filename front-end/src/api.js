// Makes API requests to backend
import axios from "axios";
export const api = axios.create({
  baseURL: "/api",
});