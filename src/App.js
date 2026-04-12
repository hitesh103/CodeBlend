import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthPage, Dashboard } from './pages/Home';
import EditorPage from './pages/EditorPage';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--cb-surface, #1e2128)',
                        color: 'var(--cb-text, #c9d1d9)',
                        border: '1px solid var(--cb-border, #2a2d35)',
                        fontSize: '13px',
                    },
                    success: { iconTheme: { primary: 'var(--cb-accent, #7c6af7)', secondary: '#fff' } },
                }}
            />
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<AuthPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/editor/:roomId" element={<EditorPage />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </>
    );
}

export default App;