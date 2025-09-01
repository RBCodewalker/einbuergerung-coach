/**
 * Robust storage system with multiple fallbacks
 * Priority: localStorage > sessionStorage > cookies
 */

import { getCookie } from './cookies';

const STORAGE_VERSION = '1.0';
const VERSION_KEY = '_storage_version';

export const StorageType = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage', 
  COOKIE: 'cookie'
};

/**
 * Check if a storage type is available
 */
function isStorageAvailable(type) {
  try {
    if (typeof window === 'undefined') return false;
    
    const storage = window[type];
    const testKey = '__test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get the best available storage method
 */
function getBestStorage() {
  if (isStorageAvailable('localStorage')) return StorageType.LOCAL;
  if (isStorageAvailable('sessionStorage')) return StorageType.SESSION;
  return StorageType.COOKIE;
}

/**
 * Enhanced cookie setting with mobile-friendly attributes
 */
function setSecureCookie(name, value, days = 36500) {
  try {
    if (typeof document === 'undefined') return false;
    
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Enhanced cookie attributes for mobile compatibility
    const secure = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? '; Secure' : '';
    const sameSite = '; SameSite=Lax'; // More permissive than Strict, works better on mobile
    const path = '; path=/';
    const expires = `; expires=${date.toUTCString()}`;
    
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}${path}${sameSite}${secure}`;
    return true;
  } catch (error) {
    console.error('Failed to set cookie:', error);
    return false;
  }
}

/**
 * Set data with automatic fallback chain
 */
export function setStorageData(key, value, enabled = true) {
  if (!enabled) return false;
  
  const serializedValue = JSON.stringify(value);
  const bestStorage = getBestStorage();
  
  // Try primary storage
  try {
    if (bestStorage === StorageType.LOCAL) {
      localStorage.setItem(key, serializedValue);
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      return true;
    }
    
    if (bestStorage === StorageType.SESSION) {
      sessionStorage.setItem(key, serializedValue);
      sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      return true;
    }
    
    // Fallback to enhanced cookies
    return setSecureCookie(key, serializedValue);
    
  } catch (error) {
    console.error(`Failed to set ${bestStorage}:`, error);
    
    // Try fallback storage methods
    if (bestStorage !== StorageType.SESSION && isStorageAvailable('sessionStorage')) {
      try {
        sessionStorage.setItem(key, serializedValue);
        return true;
      } catch (e) {
        console.error('SessionStorage fallback failed:', e);
      }
    }
    
    // Final fallback to cookies
    if (bestStorage !== StorageType.COOKIE) {
      try {
        return setSecureCookie(key, serializedValue);
      } catch (e) {
        console.error('Cookie fallback failed:', e);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Get data with automatic fallback chain
 */
export function getStorageData(key) {
  try {
    // Try localStorage first
    if (isStorageAvailable('localStorage')) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
    }
    
    // Try sessionStorage
    if (isStorageAvailable('sessionStorage')) {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
    }
    
    // Fallback to cookies
    const cookieValue = getCookie(key);
    if (cookieValue) {
      return JSON.parse(cookieValue);
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get storage data for ${key}:`, error);
    return null;
  }
}

/**
 * Remove data from all storage types
 */
export function removeStorageData(key) {
  try {
    // Remove from localStorage
    if (isStorageAvailable('localStorage')) {
      localStorage.removeItem(key);
    }
    
    // Remove from sessionStorage
    if (isStorageAvailable('sessionStorage')) {
      sessionStorage.removeItem(key);
    }
    
    // Remove from cookies
    try {
      setSecureCookie(key, '', -1);
    } catch (e) {
      console.error('Failed to remove cookie:', e);
    }
  } catch (error) {
    console.error(`Failed to remove storage data for ${key}:`, error);
  }
}

/**
 * Migrate data from old cookie-only system
 */
export function migrateFromCookies() {
  const cookieKeys = [
    'lid.stats',
    'lid.mode', 
    'lid.answers',
    'lid.flags',
    'lid.quizDuration',
    'lid.excludeCorrect',
    'lid.selectedState',
    'lid.consent',
    'lid.dark'
  ];
  
  let migrated = false;
  
  cookieKeys.forEach(key => {
    const cookieValue = getCookie(key);
    if (cookieValue && isStorageAvailable('localStorage')) {
      try {
        // Only migrate if localStorage doesn't have this key
        const localValue = localStorage.getItem(key);
        if (!localValue) {
          localStorage.setItem(key, cookieValue);
          migrated = true;
        }
      } catch (error) {
        console.error(`Failed to migrate ${key}:`, error);
      }
    }
  });
  
  if (migrated) {
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  }
}

/**
 * Get storage info for debugging
 */
export function getStorageInfo() {
  return {
    bestStorage: getBestStorage(),
    available: {
      localStorage: isStorageAvailable('localStorage'),
      sessionStorage: isStorageAvailable('sessionStorage'),
      cookies: typeof document !== 'undefined'
    },
    version: getStorageData(VERSION_KEY) || 'legacy'
  };
}

/**
 * Validate and repair data integrity
 */
export function validateStorageIntegrity(key, validator) {
  const data = getStorageData(key);
  if (!data) return null;
  
  try {
    const isValid = validator(data);
    if (!isValid) {
      console.warn(`Invalid data detected for ${key}, removing...`);
      removeStorageData(key);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Validation failed for ${key}:`, error);
    removeStorageData(key);
    return null;
  }
}