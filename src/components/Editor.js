import React, { useEffect, useRef, useState, useCallback } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/material-ocean.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/elegant.css';

// Language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/clike/clike'; // C, C++, Java
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/go/go';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/shell/shell';

// Addons
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';

import ACTIONS from '../actions';
import './Editor.css';

const LANGUAGES = [
    { label: 'JavaScript', mode: { name: 'javascript', json: true }, ext: 'js' },
    { label: 'Python',     mode: 'python',                           ext: 'py' },
    { label: 'HTML',       mode: 'htmlmixed',                        ext: 'html' },
    { label: 'CSS',        mode: 'css',                              ext: 'css' },
    { label: 'Java',       mode: 'text/x-java',                      ext: 'java' },
    { label: 'C++',        mode: 'text/x-c++src',                    ext: 'cpp' },
    { label: 'Rust',       mode: 'rust',                             ext: 'rs' },
    { label: 'Go',         mode: 'go',                               ext: 'go' },
    { label: 'Markdown',   mode: 'markdown',                         ext: 'md' },
    { label: 'Shell',      mode: 'shell',                            ext: 'sh' },
];

const EDITOR_THEMES = [
    { label: 'Dracula', value: 'dracula' },
    { label: 'Monokai', value: 'monokai' },
    { label: 'Material Ocean', value: 'material-ocean' },
    { label: 'Neat', value: 'neat' },
    { label: 'Elegant', value: 'elegant' },
    { label: 'Default', value: 'default' },
];

// Assign a stable color per username
const USER_COLORS = [
    '#7c6af7', '#f76a6a', '#6af7a0', '#f7c46a',
    '#6ac8f7', '#f76ac8', '#a0f76a', '#f7f76a',
];
const colorCache = {};
let colorIndex = 0;
function getUserColor(username) {
    if (!colorCache[username]) {
        colorCache[username] = USER_COLORS[colorIndex % USER_COLORS.length];
        colorIndex++;
    }
    return colorCache[username];
}

/**
 * Editor component — CodeMirror with real-time sync, language switching,
 * typing indicators, remote cursor markers, download, and copy-all.
 */
function languageFromExt(ext) {
    if (!ext) return null;
    return LANGUAGES.find((l) => l.ext.toLowerCase() === ext.toLowerCase()) || null;
}

function extFromName(name) {
    if (!name) return '';
    const idx = name.lastIndexOf('.');
    if (idx === -1) return '';
    return name.slice(idx + 1);
}

const Editor = ({
    socketRef,
    roomId,
    onCodeChange,
    typingUsers = [],
    activeFileName = null,
    externalCode = null,
    broadcastExternalCode = false,
    onSave = null,
    saveDisabled = false,
    editorTheme = 'dracula',
}) => {
    const editorRef = useRef(null);
    const cursorMarkers = useRef({});
    const typingTimer = useRef(null);
    const isRemoteChange = useRef(false);

    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [cursorPos, setCursorPos] = useState({ line: 1, ch: 1 });
    const [copied, setCopied] = useState(false);

    // Initialize CodeMirror once
    useEffect(() => {
        const editor = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
            mode: language.mode,
            theme: editorTheme || 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine: true,
            tabSize: 2,
            indentWithTabs: false,
        });

        editor.setSize('100%', '100%');
        editorRef.current = editor;

        editor.on('change', (instance, changes) => {
            const code = instance.getValue();
            onCodeChange(code);
            if (!isRemoteChange.current && changes.origin !== 'setValue') {
                socketRef.current?.emit(ACTIONS.CODE_CHANGE, { roomId, code });

                // Typing indicator: emit typing, then clear after 1.5s idle
                socketRef.current?.emit(ACTIONS.TYPING, { roomId, username: socketRef.current._username, isTyping: true });
                clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(() => {
                    socketRef.current?.emit(ACTIONS.TYPING, { roomId, username: socketRef.current._username, isTyping: false });
                }, 1500);
            }
        });

        editor.on('cursorActivity', (instance) => {
            const pos = instance.getCursor();
            setCursorPos({ line: pos.line + 1, ch: pos.ch + 1 });
            socketRef.current?.emit(ACTIONS.CURSOR_CHANGE, {
                roomId,
                username: socketRef.current._username,
                cursor: { line: pos.line, ch: pos.ch },
            });
        });

        return () => {
            clearTimeout(typingTimer.current);
            editor.toTextArea();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // When a file is opened, switch language based on extension.
    useEffect(() => {
        const ext = extFromName(activeFileName);
        const next = languageFromExt(ext);
        if (next) setLanguage(next);
        if (next && editorRef.current) editorRef.current.setOption('mode', next.mode);
    }, [activeFileName]);

    // Update editor theme when it changes
    useEffect(() => {
        if (editorRef.current && editorTheme) {
            editorRef.current.setOption('theme', editorTheme);
        }
    }, [editorTheme]);

    // Load external content into the editor and optionally broadcast to the room.
    useEffect(() => {
        if (externalCode === null || externalCode === undefined) return;
        if (!editorRef.current) return;

        isRemoteChange.current = true;
        editorRef.current.setValue(String(externalCode));
        editorRef.current.setCursor({ line: 0, ch: 0 });
        isRemoteChange.current = false;

        if (broadcastExternalCode) {
            socketRef.current?.emit(ACTIONS.CODE_CHANGE, { roomId, code: String(externalCode) });
        }
    }, [externalCode, broadcastExternalCode, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for remote code changes
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleCodeChange = ({ code }) => {
            if (code !== null && editorRef.current) {
                isRemoteChange.current = true;
                const cursor = editorRef.current.getCursor();
                editorRef.current.setValue(code);
                editorRef.current.setCursor(cursor);
                isRemoteChange.current = false;
            }
        };

        const handleCursorChange = ({ username, cursor }) => {
            if (!editorRef.current) return;
            // Remove old marker for this user
            if (cursorMarkers.current[username]) {
                cursorMarkers.current[username].clear();
            }
            const el = document.createElement('span');
            el.className = 'remote-cursor';
            el.style.borderLeftColor = getUserColor(username);
            el.title = username;

            const label = document.createElement('span');
            label.className = 'remote-cursor-label';
            label.style.background = getUserColor(username);
            label.textContent = username;
            el.appendChild(label);

            cursorMarkers.current[username] = editorRef.current.setBookmark(
                { line: cursor.line, ch: cursor.ch },
                { widget: el }
            );
        };

        socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);
        socket.on(ACTIONS.CURSOR_CHANGE, handleCursorChange);

        return () => {
            socket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            socket.off(ACTIONS.CURSOR_CHANGE, handleCursorChange);
        };
    }, [socketRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

    // Switch language mode
    const handleLanguageChange = useCallback((e) => {
        const lang = LANGUAGES.find(l => l.label === e.target.value);
        if (lang && editorRef.current) {
            setLanguage(lang);
            editorRef.current.setOption('mode', lang.mode);
        }
    }, []);

    // Download code as file
    const handleDownload = useCallback(() => {
        const code = editorRef.current?.getValue() || '';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${language.ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [language]);

    // Copy all code to clipboard
    const handleCopyAll = useCallback(async () => {
        const code = editorRef.current?.getValue() || '';
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    }, []);

    return (
        <div className="editor-container">
            <div className="editor-toolbar">
                <div className="toolbar-left">
                    <span className="file-dot"></span>
                    <span className="file-name">{activeFileName || `main.${language.ext}`}</span>
                    {typingUsers.length > 0 && (
                        <span className="typing-indicator">
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                        </span>
                    )}
                </div>
                <div className="toolbar-right">
                    <select
                        className="lang-select theme-select"
                        value={editorTheme || 'dracula'}
                        onChange={(e) => {
                            if (editorRef.current) {
                                editorRef.current.setOption('theme', e.target.value);
                            }
                        }}
                        title="Editor theme"
                    >
                        {EDITOR_THEMES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <select
                        className="lang-select"
                        value={language.label}
                        onChange={handleLanguageChange}
                        title="Select language"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.label} value={l.label}>{l.label}</option>
                        ))}
                    </select>
                    <button className="toolbar-btn" onClick={handleCopyAll} title="Copy all code">
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    {onSave && (
                        <button
                            className="toolbar-btn"
                            onClick={onSave}
                            disabled={saveDisabled}
                            title={saveDisabled ? 'Select a file to save' : 'Save to database'}
                        >
                            Save
                        </button>
                    )}
                    <button className="toolbar-btn" onClick={handleDownload} title="Download file">
                        ↓ Download
                    </button>
                </div>
            </div>

            <div className="editor-body">
                <textarea id="realtimeEditor" />
            </div>

            <div className="editor-statusbar">
                <span>Ln {cursorPos.line}, Col {cursorPos.ch}</span>
                <span>{language.label}</span>
                <span>UTF-8</span>
                <span className="status-synced">⟳ synced</span>
            </div>
        </div>
    );
};

export default Editor;
