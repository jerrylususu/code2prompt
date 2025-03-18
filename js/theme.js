/**
 * Theme handling functionality for the code2prompt application
 */

// DOM Elements
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

// Theme handling
export function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    // Check for system preference if no saved theme
    if (!savedTheme) {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkScheme) {
            document.documentElement.classList.add('dark-theme');
            themeToggleCheckbox.checked = true;
        }
    } else if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        themeToggleCheckbox.checked = true;
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const isDarkMode = e.matches;
            document.documentElement.classList.toggle('dark-theme', isDarkMode);
            themeToggleCheckbox.checked = isDarkMode;
            
            // Update Monaco editor theme if it's loaded
            if (window.monacoEditor) {
                monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
            }
        }
    });

    // Theme toggle event listener
    if (themeToggleCheckbox) {
        themeToggleCheckbox.addEventListener('change', function() {
            const isDarkMode = this.checked;
            document.documentElement.classList.toggle('dark-theme', isDarkMode);
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update Monaco editor theme if it's loaded
            if (window.monacoEditor) {
                monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
            }
        });
    }
}
