// SSR-safe localStorage helper
export const getLocalStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
};

export const setLocalStorageItem = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
};

export const removeLocalStorageItem = (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
};