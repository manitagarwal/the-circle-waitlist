import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore values are limited in size, so large values (the session) are chunked.
const CHUNK = 1800;
const native = {
  async getItem(key: string) {
    const n = await SecureStore.getItemAsync(`${key}.n`);
    if (n == null) return SecureStore.getItemAsync(key);
    let out = '';
    for (let i = 0; i < Number(n); i++) out += (await SecureStore.getItemAsync(`${key}.${i}`)) ?? '';
    return out;
  },
  async setItem(key: string, value: string) {
    const parts = value.match(new RegExp(`.{1,${CHUNK}}`, 'gs')) ?? [''];
    for (let i = 0; i < parts.length; i++) await SecureStore.setItemAsync(`${key}.${i}`, parts[i]);
    await SecureStore.setItemAsync(`${key}.n`, String(parts.length));
  },
  async removeItem(key: string) {
    const n = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.n`);
    await SecureStore.deleteItemAsync(key);
  },
};

const web = {
  getItem: async (k: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: async (k: string, v: string) => void (typeof localStorage !== 'undefined' && localStorage.setItem(k, v)),
  removeItem: async (k: string) => void (typeof localStorage !== 'undefined' && localStorage.removeItem(k)),
};

export const authStorage = Platform.OS === 'web' ? web : native;
