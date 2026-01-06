import React from 'react';
import ReactDOM from 'react-dom/client';
import HomeKeep from './HomeKeep';

// Storage API using localStorage with robust error handling
window.storage = {
  async get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      console.error('Storage set error:', e);
      // Check if quota exceeded
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Consider clearing old data.');
      }
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (e) {
      console.error('Storage delete error:', e);
      return null;
    }
  },
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    } catch (e) {
      console.error('Storage list error:', e);
      return { keys: [] };
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HomeKeep />
  </React.StrictMode>
);
