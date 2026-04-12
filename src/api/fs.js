import { getToken } from './auth';

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

export async function listNodes(parentId) {
    const query = parentId ? `?parentId=${parentId}` : '';
    return request(`/fs/nodes${query}`, { method: 'GET' });
}

export async function listTree() {
    return request('/fs/tree', { method: 'GET' });
}

export async function createFolder({ name, parentId }) {
    return request('/fs/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parentId: parentId || null }),
    });
}

export async function createFile({ name, parentId, content }) {
    return request('/fs/files', {
        method: 'POST',
        body: JSON.stringify({ name, parentId: parentId || null, content: content || '' }),
    });
}

export async function getFile(id) {
    return request(`/fs/files/${id}`, { method: 'GET' });
}

export async function saveFile(id, content) {
    return request(`/fs/files/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: content || '' }),
    });
}

export async function renameNode(id, name) {
    return request(`/fs/nodes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    });
}

export async function moveNode(id, parentId) {
    return request(`/fs/nodes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ parentId }),
    });
}

export async function duplicateNode(id) {
    return request(`/fs/nodes/${id}/duplicate`, {
        method: 'POST',
    });
}

export async function deleteNode(id) {
    return request(`/fs/nodes/${id}`, { method: 'DELETE' });
}