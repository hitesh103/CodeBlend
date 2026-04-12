import { useRef, useCallback } from 'react';

const STORAGE_KEY = 'cb_code_';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useCodePersistence(roomId, fileId) {
    const codeRef = useRef('');
    const lastSaveRef = useRef(0);

    const getKey = (id) => STORAGE_KEY + (id || roomId);

    const saveToStorage = useCallback((code, forFileId) => {
        if (!code && !forFileId) return;
        const key = getKey(forFileId);
        const data = {
            code,
            timestamp: Date.now(),
        };
        try {
            window.localStorage.setItem(key, JSON.stringify(data));
            lastSaveRef.current = Date.now();
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }, [roomId]);

    const loadFromStorage = useCallback((forFileId) => {
        if (!forFileId && !roomId) return null;
        const key = getKey(forFileId);
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data.timestamp || !data.code) return null;
            const age = Date.now() - data.timestamp;
            if (age > EXPIRY_MS) {
                window.localStorage.removeItem(key);
                return null;
            }
            return data.code;
        } catch (e) {
            return null;
        }
    }, [roomId]);

    const restore = useCallback((forFileId) => {
        const savedCode = loadFromStorage(forFileId);
        if (savedCode !== null) {
            codeRef.current = savedCode;
            return savedCode;
        }
        return null;
    }, [loadFromStorage]);

    const clearStorage = useCallback((forFileId) => {
        const key = getKey(forFileId);
        window.localStorage.removeItem(key);
    }, [roomId]);

    const getLastSaved = useCallback(() => {
        return lastSaveRef.current;
    }, []);

    return {
        codeRef,
        saveToStorage,
        restore,
        loadFromStorage,
        clearStorage,
        getLastSaved,
    };
}

export function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}