// axiosInstance.js
import axios from 'axios';
import qs from 'qs';

// Choose API base depending on environment
const API_BASE = import.meta.env.DEV
  ? '/api' // use dev proxy in development
  : import.meta.env.VITE_API_URL; // production URL from Vercel env

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});
