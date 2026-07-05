'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: ((ok: boolean) => void)[] = [];

function processQueue(ok: boolean) {
  refreshQueue.forEach((cb) => cb(ok));
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    if (
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/register') ||
      original.url?.includes('/auth/check-username') ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/market/quotes') ||
      original.url?.includes('/market/status') ||
      original.url?.includes('/market/featured') ||
      original.url?.includes('/market/quote') ||
      original.url?.includes('/market/search')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((ok) => {
          if (!ok) {
            reject(error);
            return;
          }
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post<{ username: string | null }>('/auth/refresh');
      if (!data.username) {
        processQueue(false);
        const { tokenStorage } = await import('../auth/token-storage');
        tokenStorage.triggerUnauthorized();
        return Promise.reject(error);
      }
      processQueue(true);
      return apiClient(original);
    } catch (refreshError) {
      processQueue(false);
      const { tokenStorage } = await import('../auth/token-storage');
      tokenStorage.triggerUnauthorized();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
