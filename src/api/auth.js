const AUTH_KEY = 'cb_auth_token';
const USER_KEY = 'cb_user';

export function getToken() {
    return window.localStorage.getItem(AUTH_KEY);
}

export function setToken(token) {
    window.localStorage.setItem(AUTH_KEY, token);
}

export function getUser() {
    const userStr = window.localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

export function setUser(user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(USER_KEY);
}

function getApiBase() {
    const raw = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';
    return raw.replace(/\/$/, '');
}

async function request(path, options = {}) {
    const base = getApiBase();
    if (!base) throw new Error('Missing REACT_APP_BACKEND_URL');
    const token = getToken();
    const res = await fetch(`${base}${path}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data.error || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

export async function register(name, email, password) {
    const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
}

export async function login(email, password) {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
}

export async function getMe() {
    const data = await request('/auth/me', { method: 'GET' });
    setUser(data.user);
    return data;
}

export function isAuthenticated() {
    return !!getToken();
}
