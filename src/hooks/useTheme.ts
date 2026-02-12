import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        // Load saved theme
        chrome.storage.local.get('theme').then((result) => {
            if (result.theme) {
                setTheme(result.theme as Theme);
                if (result.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                }
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            }
        });
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        chrome.storage.local.set({ theme: newTheme });

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return { theme, toggleTheme };
}
