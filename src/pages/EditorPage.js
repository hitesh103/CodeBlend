import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import Editor from '../components/Editor';
import FileExplorer from '../components/FileExplorer';
import { useSocket } from '../hooks/useSocket';
import { useCodePersistence } from '../hooks/useCodePersistence';
import { ThemeSelector } from '../context/ThemeContext';
import { getFile, saveFile } from '../api/fs';
import './EditorPage.css';

function EditorPage() {
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();

    const [clients, setClients] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const codeRef = useRef(null);
    const [activeFile, setActiveFile] = useState(null); // { _id, name }
    const [externalCode, setExternalCode] = useState(null);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const { saveToStorage, restore, loadFromStorage } = useCodePersistence(roomId, activeFile?._id);

    const username = location.state?.username;

    const handleClientsUpdate = useCallback((data, eventUser) => {
        if (data === null) {
            toast.error('Socket connection failed, try again later');
            reactNavigator('/');
            return;
        }
        if (data?.remove) {
            setClients(prev => prev.filter(c => c.socketId !== data.remove));
            if (eventUser) toast.success(`${eventUser} left the room.`);
            return;
        }
        setClients(data);
        if (eventUser) toast.success(`${eventUser} joined the room.`);
    }, [reactNavigator]);

    const handleTyping = useCallback((typingUser, isTyping) => {
        setTypingUsers(prev =>
            isTyping
                ? prev.includes(typingUser) ? prev : [...prev, typingUser]
                : prev.filter(u => u !== typingUser)
        );
    }, []);

    const { socketRef, setCodeSnapshot } = useSocket({
        roomId,
        username,
        onClientsUpdate: handleClientsUpdate,
        onTyping: handleTyping,
    });

    // Store username on socket ref so Editor can access it for emitting
    if (socketRef.current) socketRef.current._username = username;

    const copyRoomId = async () => {
        try {
            const inviteUrl = `${window.location.origin}/editor/${roomId}`;
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Invite link copied.');
        } catch {
            toast.error('Could not copy invite link.');
        }
    };

    const openFile = async (fileId) => {
        // Save current code before switching files
        if (activeFile?._id && codeRef.current) {
            saveToStorage(codeRef.current, activeFile._id);
        }
        try {
            const { node } = await getFile(fileId);
            setActiveFile({ _id: node._id, name: node.name });
            // First try DB content, then fallback to localStorage
            let code = node.content || '';
            if (!code) {
                code = loadFromStorage(fileId) || '';
            }
            setExternalCode(code);
            restore(fileId);
            toast.success(`Opened ${node.name}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const saveActiveFile = async () => {
        if (!activeFile?._id) {
            toast.error('Select a file to save');
            return;
        }
        try {
            const code = codeRef.current || '';
            await saveFile(activeFile._id, code);
            saveToStorage(code, activeFile._id);
            toast.success('Saved');
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Auto-save to localStorage every 30 seconds
    useEffect(() => {
        if (!activeFile?._id || !codeRef.current) return;
        const interval = setInterval(() => {
            if (codeRef.current) {
                saveToStorage(codeRef.current, activeFile._id);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [activeFile?._id, saveToStorage]);

    // Auto-save open file to database every 5 minutes
    useEffect(() => {
        if (!activeFile?._id || !codeRef.current) return;
        const interval = setInterval(async () => {
            if (codeRef.current) {
                const code = codeRef.current;
                try {
                    await saveFile(activeFile._id, code);
                    saveToStorage(code, activeFile._id);
                    toast.success('Auto-saved');
                } catch (err) {
                    console.warn('Auto-save failed:', err);
                }
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [activeFile?._id, saveToStorage]);

    // Restore room code from localStorage on mount (no file open yet)
    useEffect(() => {
        const savedRoomCode = loadFromStorage(roomId);
        if (savedRoomCode && !activeFile) {
            setExternalCode(savedRoomCode);
            restore();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const leaveRoom = () => reactNavigator('/');

    if (!location.state) return <Navigate to="/" />;

    return (
        <div className="editor-page">
            <button 
                className="ep-mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>
            <aside className={`ep-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="ep-sidebar-top">
                    <div className="ep-logo">CB</div>
                    <div className="ep-room-info">
                        <span className="ep-room-label">ROOM</span>
                        <span className="ep-room-id" title={roomId}>
                            {roomId.slice(0, 8)}…
                        </span>
                    </div>
                    <div className="ep-theme-selector">
                        <ThemeSelector />
                    </div>
                </div>

                <div className="ep-sidebar-section ep-sidebar-files">
                    <FileExplorer
                        activeFileId={activeFile?._id || null}
                        onOpenFile={openFile}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={(id) => setSelectedFolderId(id)}
                    />
                </div>

                <div className="ep-sidebar-section ep-sidebar-connected">
                    <span className="ep-section-label">CONNECTED · {clients.length}</span>
                    <div className="ep-client-list">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>

                <div className="ep-sidebar-bottom">
                    <button className="ep-btn ep-copy-btn" onClick={copyRoomId}>
                        Copy Invite Link
                    </button>
                    <button className="ep-btn ep-leave-btn" onClick={leaveRoom}>
                        Leave Room
                    </button>
                </div>
            </aside>

            <div className="ep-editor-wrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    typingUsers={typingUsers}
                    activeFileName={activeFile?.name || null}
                    externalCode={externalCode}
                    broadcastExternalCode={true}
                    onSave={saveActiveFile}
                    saveDisabled={!activeFile?._id}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                        setCodeSnapshot(code);
                    }}
                />
            </div>
        </div>
    );
}

export default EditorPage;
