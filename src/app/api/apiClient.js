// apiClient.js
import axios from "axios";

// token को env से ले सकते हैं या localStorage से — कभी भी हार्ड-कोड न करें
const DEFAULT_TOKEN = process.env.SWIFTANDGO_TOKEN || null;

const apiClient = axios.create({
  baseURL:  `${process.env.NEXT_PUBLIC_MAIN}`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    ...(DEFAULT_TOKEN ? { Authorization: `Bearer ${DEFAULT_TOKEN}` } : {})
  }
});

// runtime पर token सेट/अपडेट करने के लिए helper:
export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

// example request
export async function getMessages() {
  const resp = await apiClient.get("/messages");
  return resp.data;
}

export default apiClient;
