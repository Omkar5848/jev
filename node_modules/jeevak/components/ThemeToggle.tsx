import { useState, useEffect } from "react";
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
    type Theme = 'light' | 'dark';
    const [theme, setTheme] = useState<Theme>('light');

    // Initialize theme
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // 1. Check LocalStorage
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        
        // 2. Check System Preference
        const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        
        // 3. Decide initial
        const initialTheme = savedTheme ?? (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        
        // 4. Apply immediately on mount
        document.documentElement.setAttribute('data-color-scheme', initialTheme);
    }, []);

    // Apply theme changes whenever state changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // CRITICAL FIX: Changed 'data-theme' to 'data-color-scheme' to match globals.css
        document.documentElement.setAttribute('data-color-scheme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="theme-toggle-btn"
            style={{
                height: '40px',
                width: '40px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
    );
}