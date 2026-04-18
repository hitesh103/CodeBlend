import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createFile, createFolder, deleteNode, listNodes, renameNode, moveNode, duplicateNode, getFile } from '../api/fs';
import './FileExplorer.css';

const FILE_ICONS = {
    py: '🐍', js: '🟨', ts: '🔷', jsx: '⚛️', tsx: '⚛️', html: '🌐', css: '🎨',
    json: '📋', md: '📝', txt: '📄', go: '🔵', rs: '🦀',
    java: '☕', cpp: '➕', c: '➕', scss: '🎨', less: '🎨',
    default: '📄'
};

function getFileIcon(name) {
    if (!name) return FILE_ICONS.default;
    const ext = name.split('.').pop()?.toLowerCase();
    return FILE_ICONS[ext] || FILE_ICONS.default;
}

function buildTree(nodes) {
    if (!nodes || !Array.isArray(nodes)) {
        return { _id: 'root', type: 'folder', name: 'root', parentId: null, children: [] };
    }
    const byId = new Map(nodes.map((n) => [n._id, { ...n, children: [] }]));
    const root = { _id: 'root', type: 'folder', name: 'root', parentId: null, children: [] };

    for (const node of byId.values()) {
        const parentId = node.parentId;
        const parent = parentId && byId.get(parentId) ? byId.get(parentId) : root;
        parent.children.push(node);
    }

    const sort = (arr) => {
        arr.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        for (const child of arr) if (child.children) sort(child.children);
    };
    sort(root.children);

    return root;
}

function getPath(nodes, targetId) {
    const byId = new Map(nodes.map(n => [n._id, n]));
    const path = [];
    let current = byId.get(targetId);
    while (current) {
        path.unshift(current);
        current = current.parentId ? byId.get(current.parentId) : null;
    }
    return path;
}

export default function FileExplorer({ activeFileId, onOpenFile, selectedFolderId, onSelectFolder }) {
    const [nodes, setNodes] = useState([]);
    const [expanded, setExpanded] = useState(() => new Set(['root']));
    const [loading, setLoading] = useState(false);
    const [createMode, setCreateMode] = useState(null);
    const [newName, setNewName] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [dragged, setDragged] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const inputRef = useRef(null);
    const renameRef = useRef(null);

    const tree = useMemo(() => buildTree(nodes), [nodes]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { nodes: list } = await listNodes();
            setNodes(list || []);
        } catch (err) {
            toast.error(err.message);
            setNodes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (createMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [createMode]);

    useEffect(() => {
        if (renaming && renameRef.current) {
            renameRef.current.focus();
            renameRef.current.select();
        }
    }, [renaming]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
                setRenaming(null);
            }
        };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const activeParentId = selectedFolderId || null;

    const breadcrumbs = useMemo(() => {
        if (!activeParentId || activeParentId === 'root') return [];
        return getPath(nodes, activeParentId);
    }, [nodes, activeParentId]);

    const toggleExpand = (id) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDelete = useCallback(async (node, e) => {
        e?.stopPropagation();
        const ok = window.confirm(`Delete "${node.name}"?`);
        if (!ok) return;
        try {
            await deleteNode(node._id);
            toast.success('Deleted');
            await refresh();
        } catch (err) {
            toast.error(err.message);
        }
    }, [refresh]);

    const handleKeyDown = useCallback((e, node) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (node.type === 'folder') {
                onSelectFolder?.(node._id);
                toggleExpand(node._id);
            } else {
                onOpenFile?.(node._id);
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleDelete(node);
        }
    }, [onSelectFolder, onOpenFile, handleDelete]);

    const startCreate = (mode) => {
        setCreateMode(mode);
        setNewName('');
    };

    const cancelCreate = () => {
        setCreateMode(null);
        setNewName('');
    };

    const submitCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        try {
            if (createMode === 'folder') {
                await createFolder({ name, parentId: activeParentId === 'root' ? null : activeParentId });
                toast.success('Folder created');
            } else if (createMode === 'file') {
                const { node } = await createFile({ name, parentId: activeParentId === 'root' ? null : activeParentId, content: '' });
                toast.success('File created');
                onOpenFile?.(node._id);
            }
            setCreateMode(null);
            setNewName('');
            if (activeParentId && activeParentId !== 'root') setExpanded(prev => new Set(prev).add(activeParentId));
            await refresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleRename = async (node, e) => {
        e?.stopPropagation();
        if (!renaming) {
            setRenaming(node._id);
            return;
        }
        const name = newName.trim();
        if (!name || name === node.name) {
            setRenaming(null);
            return;
        }
        try {
            await renameNode(node._id, name);
            toast.success('Renamed');
            setRenaming(null);
            await refresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const startRename = (node, e) => {
        e.stopPropagation();
        setNewName(node.name);
        setRenaming(node._id);
    };

    const handleDuplicate = async (node, e) => {
        e?.stopPropagation();
        try {
            await duplicateNode(node._id);
            toast.success('Duplicated');
            await refresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleContextMenu = (e, node) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            node
        });
    };

    const handleDragStart = (e, node) => {
        e.dataTransfer.setData('text/plain', node._id);
        e.dataTransfer.effectAllowed = 'move';
        setDragged(node._id);
    };

    const handleDragEnd = () => {
        setDragged(null);
        setDropTarget(null);
    };

    const handleDragOver = (e, node) => {
        e.preventDefault();
        if (node.type !== 'folder') return;
        if (dragged === node._id) return;
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(node._id);
    };

    const handleDrop = async (e, targetNode) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragged || dragged === targetNode._id) return;
        try {
            await moveNode(dragged, targetNode._id);
            toast.success('Moved');
            await refresh();
        } catch (err) {
            toast.error(err.message);
        }
        setDragged(null);
        setDropTarget(null);
    };

    const openFile = async (fileId) => {
        try {
            const { node } = await getFile(fileId);
            onOpenFile?.(node._id);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const renderNode = (node, depth = 0) => {
        const depthPadding = node.type === 'folder' ? depth * 12 + 8 : depth * 12 + 24;
        const isRenaming = renaming === node._id;

        const isDropTarget = dropTarget === node._id;

        if (node.type === 'folder') {
            const isOpen = expanded.has(node._id);
            const isSelected = (selectedFolderId || 'root') === node._id;

            return (
                <div key={node._id}>
                    <div 
                        className={`fx-row ${isOpen ? 'is-open' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                        style={{ paddingLeft: `${depthPadding}px` }}
                        onContextMenu={(e) => handleContextMenu(e, node)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, node)}
                        onDrop={(e) => handleDrop(e, node)}
                    >
                        <button
                            className={`fx-item fx-folder ${isSelected ? 'is-selected' : ''} ${isOpen ? 'is-open' : ''}`}
                            onClick={() => {
                                onSelectFolder?.(node._id);
                                toggleExpand(node._id);
                            }}
                            title={node.name}
                            type="button"
                            onKeyDown={(e) => handleKeyDown(e, node)}
                        >
                            <span className="fx-caret">{isOpen ? '▼' : '▶'}</span>
                            {isRenaming ? (
                                <input
                                    ref={renameRef}
                                    className="fx-rename-input"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter') handleRename(node);
                                        if (e.key === 'Escape') setRenaming(null);
                                    }}
                                    onBlur={() => handleRename(node)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="fx-name">{node.name}</span>
                            )}
                        </button>
                        <button 
                            className="fx-icon" 
                            type="button" 
                            onClick={(e) => handleDelete(node, e)}
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                    {isOpen && node.children?.length > 0 && (
                        <div className="fx-children">
                            {node.children.map(child => renderNode(child, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        const isActive = activeFileId === node._id;
        return (
            <div 
                key={node._id} 
                className="fx-row"
                style={{ paddingLeft: `${depthPadding}px` }}
                onContextMenu={(e) => handleContextMenu(e, node)}
                draggable
                onDragStart={(e) => handleDragStart(e, node)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <button
                    className={`fx-item fx-file ${isActive ? 'is-active' : ''}`}
                    onClick={() => onOpenFile?.(node._id)}
                    title={node.name}
                    type="button"
                    onKeyDown={(e) => handleKeyDown(e, node)}
                >
                    {isRenaming ? (
                        <input
                            ref={renameRef}
                            className="fx-rename-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') handleRename(node);
                                if (e.key === 'Escape') setRenaming(null);
                            }}
                            onBlur={() => handleRename(node)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="fx-name"><span className="fx-file-icon">{getFileIcon(node.name)}</span>{node.name}</span>
                    )}
                </button>
                <button 
                    className="fx-icon" 
                    type="button" 
                    onClick={(e) => handleDelete(node, e)}
                    title="Delete"
                >
                    ×
                </button>
            </div>
        );
    };

    useEffect(() => {
        const handleNewFile = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                startCreate('file');
            }
        };
        window.addEventListener('keydown', handleNewFile);
        return () => window.removeEventListener('keydown', handleNewFile);
    }, []);

    return (
        <div className="fx">
            <div className="fx-header">
                <span className="fx-title">EXPLORER</span>
                <div className="fx-actions">
                    <button 
                        className="fx-action" 
                        type="button" 
                        onClick={() => startCreate('file')} 
                        title="New file in current folder"
                    >
                        +File
                    </button>
                    <button 
                        className="fx-action" 
                        type="button" 
                        onClick={() => startCreate('folder')} 
                        title="New folder in current folder"
                    >
                        +Folder
                    </button>
                </div>
            </div>

            {breadcrumbs.length > 0 && (
                <div className="fx-breadcrumbs">
                    <button 
                        className="fx-breadcrumb"
                        onClick={() => onSelectFolder?.(null)}
                    >
                        Files
                    </button>
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={crumb._id}>
                            <span className="fx-breadcrumb-sep">/</span>
                            <button 
                                className="fx-breadcrumb"
                                onClick={() => {
                                    onSelectFolder?.(crumb._id);
                                    setExpanded(prev => new Set(prev).add(crumb._id));
                                }}
                            >
                                {crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div className="fx-body">
                {loading && <div className="fx-empty">Loading…</div>}
                {!loading && nodes.length === 0 && (
                    <div className="fx-empty">
                        <p>No files yet</p>
                        <button className="fx-empty-btn" onClick={() => startCreate('file')}>
                            + Create your first file
                        </button>
                    </div>
                )}

                {createMode && (
                    <div className="fx-create">
                        <input
                            ref={inputRef}
                            className="fx-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={createMode === 'folder' ? 'folder name' : 'file name'}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') submitCreate();
                                if (e.key === 'Escape') cancelCreate();
                            }}
                        />
                        <button className="fx-action" type="button" onClick={submitCreate}>
                            ✓
                        </button>
                        <button className="fx-action" type="button" onClick={cancelCreate}>
                            ×
                        </button>
                    </div>
                )}

                {tree.children?.length > 0 && (
                    <div className="fx-tree">
                        {tree.children?.map(n => renderNode(n, 0))}
                    </div>
                )}
            </div>

            {contextMenu && (
                <div 
                    className="fx-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.node.type === 'file' && (
                        <div 
                            className="fx-context-item"
                            onClick={() => {
                                openFile(contextMenu.node._id);
                                setContextMenu(null);
                            }}
                        >
                            Open
                        </div>
                    )}
                    <div 
                        className="fx-context-item"
                        onClick={() => {
                            startRename(contextMenu.node);
                            setContextMenu(null);
                        }}
                    >
                        Rename
                    </div>
                    <div 
                        className="fx-context-item"
                        onClick={() => {
                            handleDuplicate(contextMenu.node);
                            setContextMenu(null);
                        }}
                    >
                        Duplicate
                    </div>
                    <div 
                        className="fx-context-item danger"
                        onClick={() => {
                            handleDelete(contextMenu.node);
                            setContextMenu(null);
                        }}
                    >
                        Delete
                    </div>
                </div>
            )}
        </div>
    );
}