/**
 * Debug logging for the code2prompt application
 */

// Override console methods to also log to the page
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Create a debug log element
document.addEventListener('DOMContentLoaded', () => {
    const debugLog = document.createElement('div');
    debugLog.id = 'debug-log';
    debugLog.style.position = 'fixed';
    debugLog.style.bottom = '0';
    debugLog.style.left = '0';
    debugLog.style.width = '100%';
    debugLog.style.maxHeight = '200px';
    debugLog.style.overflowY = 'auto';
    debugLog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugLog.style.color = 'white';
    debugLog.style.padding = '10px';
    debugLog.style.fontFamily = 'monospace';
    debugLog.style.fontSize = '12px';
    debugLog.style.zIndex = '9999';
    debugLog.style.display = 'none'; // Hidden by default
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Debug Log';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '10000';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.cursor = 'pointer';
    
    toggleButton.addEventListener('click', () => {
        if (debugLog.style.display === 'none') {
            debugLog.style.display = 'block';
            toggleButton.textContent = 'Hide Debug Log';
        } else {
            debugLog.style.display = 'none';
            toggleButton.textContent = 'Show Debug Log';
        }
    });
    
    document.body.appendChild(debugLog);
    document.body.appendChild(toggleButton);
    
    // Override console methods
    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        logToElement('log', ...args);
    };
    
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        logToElement('error', ...args);
    };
    
    console.warn = function(...args) {
        originalConsoleWarn.apply(console, args);
        logToElement('warn', ...args);
    };
    
    // Log to element
    function logToElement(type, ...args) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        if (type === 'error') {
            logEntry.style.color = '#ff5555';
        } else if (type === 'warn') {
            logEntry.style.color = '#ffaa00';
        }
        
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        
        debugLog.appendChild(logEntry);
        debugLog.scrollTop = debugLog.scrollHeight;
    }
});
