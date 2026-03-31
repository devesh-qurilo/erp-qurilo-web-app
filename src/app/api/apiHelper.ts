// app/api/apiHelper.ts
import axios, { AxiosRequestConfig } from "axios";

const MAIN = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_MAIN || "") : (process.env.NEXT_PUBLIC_MAIN || "");

// helper to normalize final URL
function buildURL(pathOrUrl: string) {
  if (!pathOrUrl) throw new Error("Empty pathOrUrl passed to apiHelper");
  // if it's already a full URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  // ensure path starts with single slash
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  // if MAIN empty -> relative path (same origin)
  if (!MAIN) return path;

  // normalize MAIN: remove trailing slash if present
  const base = MAIN.endsWith("/") ? MAIN.slice(0, -1) : MAIN;

  // avoid double /api/api etc by simply concatenating
  return `${base}${path}`;
}

// single axios instance (no baseURL so we can pass full url each time)
const api = axios.create({
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

// attach token from localStorage for each request
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers || {};
        if (!("Authorization" in config.headers)) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }
  } catch (e) {
    // ignore storage errors
  }
  return config;
});

// simple debug logger to help track final URLs when 404/Network issues happen
function debugLogRequest(method: string, finalUrl: string, config?: AxiosRequestConfig) {
  // Only log in development
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[apiHelper] ${method.toUpperCase()} -> ${finalUrl}`, config || "");
  }
}

async function request(method: string, pathOrUrl: string, data?: any, config?: AxiosRequestConfig) {
  const finalUrl = buildURL(pathOrUrl);
  debugLogRequest(method, finalUrl, config);
  const axiosConfig: AxiosRequestConfig = {
    url: finalUrl,
    method: method as any,
    ...config,
  };
  if (method === "get" || method === "delete") {
    axiosConfig.params = data;
  } else {
    axiosConfig.data = data;
  }
  return api.request(axiosConfig);
}

// exported helpers — accepts EITHER full URL or path (like "/api/projects/1/tasks" or "/projects/1/tasks")
export async function getAPI(pathOrUrl: string, config?: AxiosRequestConfig) {
  return request("get", pathOrUrl, undefined, config);
}
export async function postAPI(pathOrUrl: string, data?: any, config?: AxiosRequestConfig) {
  return request("post", pathOrUrl, data, config);
}
export async function putAPI(pathOrUrl: string, data?: any, config?: AxiosRequestConfig) {
  return request("put", pathOrUrl, data, config);
}
export async function deleteAPI(pathOrUrl: string, config?: AxiosRequestConfig) {
  return request("delete", pathOrUrl, undefined, config);
}

export function setAuthToken(token: string | null) {
  if (token) {
    if (typeof window !== "undefined") localStorage.setItem("accessToken", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    delete api.defaults.headers.common["Authorization"];
  }
}

export default api;
