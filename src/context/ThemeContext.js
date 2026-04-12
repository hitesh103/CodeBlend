import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = {
    dark: {
        name: 'Dark',
        bg: '#0d0f14',
        surface: '#161920',
        border: '#1e2128',
        text: '#c9d1d9',
        textMuted: '#6e7681',
        accent: '#7c6af7',
        accentHover: '#8b7bf8',
    },
    light: {
        name: 'Light',
        bg: '#ffffff',
        surface: '#f6f8fa',
        border: '#d0d7de',
        text: '#1f2328',
        textMuted: '#656d76',
        accent: '#0969da',
        accentHover: '#0550ae',
    },
    ocean: {
        name: 'Ocean',
        bg: '#0a1929',
        surface: '#132f4c',
        border: '#1e3a5f',
        text: '#b2d5f5',
        textMuted: '#5d8aa8',
        accent: '#4fc3f7',
        accentHover: '#81d4fa',
    },
    forest: {
        name: 'Forest',
        bg: '#0d1310',
        surface: '#141f1a',
        border: '#1a2e24',
        text: '#c5e1cd',
        textMuted: '#6e8877',
        accent: '#4caf50',
        accentHover: '#66bb6a',
    },
    sunset: {
        name: 'Sunset',
        bg: '#140a0a',
        surface: '#1f1414',
        border: '#2e1a1a',
        text: '#f5d5d5',
        textMuted: '#887777',
        accent: '#f87171',
        accentHover: '#fca5a5',
    },
    lavender: {
        name: 'Lavender',
        bg: '#12100f16',
        surface: '#1a1820',
        border: '#242028',
        text: '#d4d0e0',
        textMuted: '#7a7588',
        accent: '#a78bfa',
        accentHover: '#c4b5fd',
    },
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('cb_theme');
        return Object.keys(THEMES).includes(saved) ? saved : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('cb_theme', theme);
        const t = THEMES[theme];
        document.documentElement.style.setProperty('--cb-bg', t.bg);
        document.documentElement.style.setProperty('--cb-surface', t.surface);
        document.documentElement.style.setProperty('--cb-border', t.border);
        document.documentElement.style.setProperty('--cb-text', t.text);
        document.documentElement.style.setProperty('--cb-text-muted', t.textMuted);
        document.documentElement.style.setProperty('--cb-accent', t.accent);
        document.documentElement.style.setProperty('--cb-accent-hover', t.accentHover);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeSelector() {
    const { theme, setTheme, themes } = useTheme();
    
    return (
        <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-selector"
        >
            {Object.entries(themes).map(([key, t]) => (
                <option key={key} value={key}>{t.name}</option>
            ))}
        </select>
    );
}