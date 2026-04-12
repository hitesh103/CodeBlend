const express = require('express');
const jwt = require('jsonwebtoken');
const FsNode = require('../models/FsNode');
const { isMongoReady } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'codeblend-secret-key-change-in-production';

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function validateName(name) {
    if (!name || typeof name !== 'string') return 'Name is required';
    const trimmed = name.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length > 120) return 'Name too long';
    if (trimmed.includes('/') || trimmed.includes('\\')) return 'Name cannot include slashes';
    return null;
}

async function assertParentFolder(userId, parentId) {
    if (!parentId) return null;
    const parent = await FsNode.findOne({ _id: parentId, userId }).lean();
    if (!parent) return { error: 'Parent folder not found' };
    if (parent.type !== 'folder') return { error: 'Parent must be a folder' };
    return { parent };
}

async function deleteRecursively(userId, rootId) {
    const toVisit = [rootId];
    const allIds = new Set();

    while (toVisit.length) {
        const id = toVisit.pop();
        if (!id || allIds.has(String(id))) continue;
        allIds.add(String(id));
        const children = await FsNode.find({ userId, parentId: id }, { _id: 1 }).lean();
        for (const child of children) toVisit.push(child._id);
    }

    await FsNode.deleteMany({ userId, _id: { $in: Array.from(allIds) } });
}

async function moveNodeToFolder(userId, nodeId, targetParentId) {
    const node = await FsNode.findOne({ _id: nodeId, userId });
    if (!node) return { error: 'Node not found' };

    if (targetParentId) {
        const target = await FsNode.findOne({ _id: targetParentId, userId });
        if (!target) return { error: 'Target folder not found' };
        if (target.type !== 'folder') return { error: 'Target must be a folder' };
        
        const isDescendant = async (parent, childId) => {
            if (String(parent._id) === String(childId)) return true;
            const children = await FsNode.find({ userId, parentId: parent._id }, { _id: 1 }).lean();
            for (const child of children) {
                if (await isDescendant(child, childId)) return true;
            }
            return false;
        };
        
        if (await isDescendant(node, targetParentId)) {
            return { error: 'Cannot move folder into itself or its descendant' };
        }
    }

    const existing = await FsNode.findOne({ 
        userId, 
        parentId: targetParentId || null, 
        name: node.name, 
        _id: { $ne: node._id } 
    });
    if (existing) return { error: 'Name already exists in target folder' };

    node.parentId = targetParentId || null;
    await node.save();
    return { node };
}

module.exports = function createFsRouter() {
    const router = express.Router();

    router.use((req, res, next) => {
        if (!isMongoReady()) return res.status(503).json({ error: 'MongoDB not configured' });
        next();
    });
    router.use(express.json({ limit: '1mb' }));
    router.use(requireAuth);

    router.get('/nodes', async (req, res) => {
        const { parentId } = req.query;
        const query = { userId: req.userId };
        if (parentId) {
            query.parentId = parentId;
        }
        const nodes = await FsNode.find(query)
            .select({ content: 0 })
            .sort({ type: 1, name: 1 })
            .lean();
        res.json({ nodes });
    });

    router.get('/tree', async (req, res) => {
        const nodes = await FsNode.find({ userId: req.userId })
            .select({ content: 0 })
            .lean();
        res.json({ nodes });
    });

    router.post('/folders', async (req, res) => {
        const { name, parentId = null } = req.body || {};
        const nameErr = validateName(name);
        if (nameErr) return res.status(400).json({ error: nameErr });

        const parentCheck = await assertParentFolder(req.userId, parentId);
        if (parentCheck?.error) return res.status(404).json({ error: parentCheck.error });

        try {
            const node = await FsNode.create({
                userId: req.userId,
                type: 'folder',
                name: name.trim(),
                parentId: parentId || null,
            });
            res.status(201).json({ node });
        } catch (err) {
            if (err && err.code === 11000) return res.status(409).json({ error: 'Name already exists in this folder' });
            res.status(500).json({ error: 'Failed to create folder' });
        }
    });

    router.post('/files', async (req, res) => {
        const { name, parentId = null, content = '' } = req.body || {};
        const nameErr = validateName(name);
        if (nameErr) return res.status(400).json({ error: nameErr });

        const parentCheck = await assertParentFolder(req.userId, parentId);
        if (parentCheck?.error) return res.status(404).json({ error: parentCheck.error });

        try {
            const node = await FsNode.create({
                userId: req.userId,
                type: 'file',
                name: name.trim(),
                parentId: parentId || null,
                content: typeof content === 'string' ? content : '',
            });
            res.status(201).json({ node });
        } catch (err) {
            if (err && err.code === 11000) return res.status(409).json({ error: 'Name already exists in this folder' });
            res.status(500).json({ error: 'Failed to create file' });
        }
    });

    router.get('/files/:id', async (req, res) => {
        const node = await FsNode.findOne({ _id: req.params.id, userId: req.userId }).lean();
        if (!node) return res.status(404).json({ error: 'File not found' });
        if (node.type !== 'file') return res.status(400).json({ error: 'Not a file' });
        res.json({ node });
    });

    router.put('/files/:id', async (req, res) => {
        const { content } = req.body || {};
        const node = await FsNode.findOne({ _id: req.params.id, userId: req.userId });
        if (!node) return res.status(404).json({ error: 'File not found' });
        if (node.type !== 'file') return res.status(400).json({ error: 'Not a file' });
        node.content = typeof content === 'string' ? content : '';
        await node.save();
        res.json({ node });
    });

    router.put('/nodes/:id', async (req, res) => {
        const { name, parentId } = req.body || {};
        const node = await FsNode.findOne({ _id: req.params.id, userId: req.userId });
        if (!node) return res.status(404).json({ error: 'Node not found' });

        if (name) {
            const nameErr = validateName(name);
            if (nameErr) return res.status(400).json({ error: nameErr });
            node.name = name.trim();
        }

        if (parentId !== undefined) {
            const moveResult = await moveNodeToFolder(req.userId, node._id, parentId);
            if (moveResult?.error) return res.status(400).json({ error: moveResult.error });
            return res.json({ node: moveResult.node || node });
        }

        await node.save();
        res.json({ node });
    });

    router.post('/nodes/:id/duplicate', async (req, res) => {
        const node = await FsNode.findOne({ _id: req.params.id, userId: req.userId });
        if (!node) return res.status(404).json({ error: 'Node not found' });

        const baseName = node.name.replace(/(\.[^.]+)$/, ' (copy)$1');
        const ext = node.type === 'file' ? '.' + node.name.split('.').pop() : '';
        let newName = baseName;
        let counter = 1;

        while (await FsNode.findOne({ userId: req.userId, parentId: node.parentId, name: newName })) {
            counter++;
            newName = node.type === 'file' 
                ? node.name.replace(/(\.[^.]+)$/, ` (copy ${counter})$1`)
                : `${node.name} (copy ${counter})`;
        }

        if (node.type === 'file') {
            const newNode = await FsNode.create({
                userId: req.userId,
                type: 'file',
                name: newName,
                parentId: node.parentId,
                content: node.content,
            });
            return res.status(201).json({ node: newNode });
        } else {
            const newNode = await FsNode.create({
                userId: req.userId,
                type: 'folder',
                name: newName,
                parentId: node.parentId,
            });
            return res.status(201).json({ node: newNode });
        }
    });

    router.delete('/nodes/:id', async (req, res) => {
        const node = await FsNode.findOne({ _id: req.params.id, userId: req.userId }).lean();
        if (!node) return res.status(404).json({ error: 'Node not found' });
        await deleteRecursively(req.userId, node._id);
        res.json({ ok: true });
    });

    return router;
};