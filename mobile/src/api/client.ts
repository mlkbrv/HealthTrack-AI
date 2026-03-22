import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "../config";

const ACCESS = "ht_access";
const REFRESH = "ht_refresh";

export async function loadTokens() {
  const access = await SecureStore.getItemAsync(ACCESS);
  const refresh = await SecureStore.getItemAsync(REFRESH);
  return { access, refresh };
}

export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS, access);
  await SecureStore.setItemAsync(REFRESH, refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(api: AxiosInstance): Promise<string | null> {
  const { refresh } = await loadTokens();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${getApiUrl()}/auth/token/refresh/`, { refresh });
    const access = data.access as string;
    await SecureStore.setItemAsync(ACCESS, access);
    return access;
  } catch {
    await clearTokens();
    return null;
  }
}

export function createApi(): AxiosInstance {
  const api = axios.create({
    baseURL: getApiUrl(),
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const { access } = await loadTokens();
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  });
  api.interceptors.response.use(
    (r) => r,
    async (err) => {
      const original = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      if (!original || err.response?.status !== 401 || original._retry) {
        return Promise.reject(err);
      }
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccess(api).finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (!newAccess) return Promise.reject(err);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    }
  );
  return api;
}

export async function loginRequest(username: string, password: string) {
  const { data } = await axios.post(
    `${getApiUrl()}/auth/token/`,
    { username, password },
    { timeout: 30000 }
  );
  await saveTokens(data.access, data.refresh);
  return data;
}

export async function registerRequest(payload: {
  username: string;
  email?: string;
  password: string;
  password_confirm: string;
}) {
  const body: Record<string, string> = {
    username: payload.username,
    password: payload.password,
    password_confirm: payload.password_confirm,
  };
  if (payload.email) body.email = payload.email;
  await axios.post(`${getApiUrl()}/auth/register/`, body, { timeout: 30000 });
  await loginRequest(payload.username, payload.password);
}
