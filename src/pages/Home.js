import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { login, register, getUser, isAuthenticated, clearAuth } from '../api/auth';
import { ThemeSelector } from '../context/ThemeContext';
import './Home.css';

function AuthPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Email and password are required');
            return;
        }
        if (!isLogin && !name) {
            toast.error('Name is required');
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                toast.success('Welcome back!');
            } else {
                await register(name, email, password);
                toast.success('Account created!');
            }
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-root">
            <aside className="home-sidebar">
                <div className="sidebar-logo">CB</div>
            </aside>

            <main className="home-main">
                <header className="home-topbar">
                    <span className="topbar-brand">CodeBlend</span>
                </header>

                <div className="home-center">
                    <div className="auth-card">
                        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                        <p className="auth-subtitle">
                            {isLogin ? 'Sign in to access your workspace' : 'Sign up to start collaborating'}
                        </p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div className="form-section">
                                    <label className="form-label">NAME</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="form-section">
                                <label className="form-label">EMAIL</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="form-section">
                                <label className="form-label">PASSWORD</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button className="init-btn" type="submit" disabled={loading}>
                                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <p className="auth-switch">
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                className="auth-switch-btn"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                <div className="bg-code-preview" aria-hidden="true">
                    <pre>{`import codeblend_sdk as cb
from core import Architect

class ProjectController:
    def __init__(self, name):
        self.project_name = name
        self.status = 'initializing'

    async def deploy_cluster(self):
        print(f"Spinning up {self.project_name}...")
        return await cb.launch_node(
            region='us-east-monolith-1',
            tier='optimized-graphite'
        )`}</pre>
                </div>
            </main>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [roomId, setRoomId] = useState('');

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            navigate('/');
            return;
        }
        setUser(currentUser);
    }, [navigate]);

    const handleLogout = () => {
        clearAuth();
        toast.success('Logged out');
        navigate('/');
    };

    const createRoomId = () => {
        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = createRoomId();
        navigate(`/editor/${id}`, { state: { username: user?.name } });
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('Room ID required');
            return;
        }
        navigate(`/editor/${roomId}`, { state: { username: user?.name } });
    };

    if (!user) return null;

    return (
        <div className="home-root">
            <aside className="home-sidebar">
                <div className="sidebar-logo">CB</div>
            </aside>

            <main className="home-main">
                <header className="home-topbar">
                    <span className="topbar-brand">CodeBlend</span>
                    <div className="topbar-user">
                        <ThemeSelector />
                        <span className="user-name">{user.name}</span>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                </header>

                <div className="home-center">
                    <div className="home-card">
                        <h1 className="card-headline">Welcome, {user.name}</h1>
                        <p className="card-sub">Join a session or start a fresh collaborative workspace.</p>

                        <div className="form-section">
                            <label className="form-label">ROOM ID</label>
                            <div className="input-row">
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Paste invite room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyUp={(e) => e.code === 'Enter' && joinRoom()}
                                />
                            </div>
                        </div>

                        <button className="init-btn" onClick={joinRoom}>
                            Join Workspace
                        </button>

                        <div className="divider"><span>OR</span></div>

                        <p className="create-info">
                            Don't have an invite?{' '}
                            <a href="/" className="create-link" onClick={createNewRoom}>
                                ↗ Create new room
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export { AuthPage, Dashboard };
