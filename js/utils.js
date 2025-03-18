/**
 * Utility functions for the code2prompt application
 */

// Format bytes to human-readable format
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Calculate and format download speed
let lastLoaded = 0;
let lastTime = Date.now();

export function formatSpeed(loaded) {
    const now = Date.now();
    const timeElapsed = (now - lastTime) / 1000; // Convert to seconds
    
    if (timeElapsed < 0.1) return ''; // Don't update too frequently
    
    const bytesPerSecond = (loaded - lastLoaded) / timeElapsed;
    
    lastLoaded = loaded;
    lastTime = now;
    
    return formatBytes(bytesPerSecond) + '/s';
}

// Check if a path is hidden (starts with . or contains /./)
export function isHiddenPath(path) {
    // Skip hidden files and directories (starting with .)
    if (path.startsWith('.') || path.includes('/./') || path.includes('\\.\\')) {
        return true;
    }
    
    // Skip common Git and system directories
    const skipDirs = [
        '.git/', '.github/', '.vscode/', '.idea/', 
        'node_modules/', '__pycache__/', '.DS_Store'
    ];
    
    for (const dir of skipDirs) {
        if (path.includes(dir)) {
            return true;
        }
    }
    
    return false;
}

// Check if a file is a binary file based on its extension
export function isBinaryFile(path) {
    const binaryExtensions = [
        // Images
        '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico',
        // Audio
        '.mp3', '.wav', '.ogg', '.flac', '.aac',
        // Video
        '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv',
        // Archives
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
        // Documents
        '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
        // Other binary
        '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.jar',
        // Large data files
        '.sqlite', '.db', '.mdb', '.accdb'
    ];
    
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(ext);
}

// Get language for code block based on file extension
export function getLanguageFromExtension(filePath) {
    const extensionMap = {
        // Web
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.json': 'json',
        '.xml': 'xml',
        '.svg': 'xml',
        
        // Programming languages
        '.py': 'python',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.rb': 'ruby',
        '.php': 'php',
        '.pl': 'perl',
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'bash',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.kts': 'kotlin',
        '.scala': 'scala',
        '.dart': 'dart',
        
        // Config files
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.toml': 'toml',
        '.ini': 'ini',
        '.cfg': 'ini',
        '.conf': 'ini',
        '.properties': 'properties',
        '.env': 'plaintext',
        
        // Markdown and documentation
        '.md': 'markdown',
        '.markdown': 'markdown',
        '.rst': 'plaintext',
        '.txt': 'plaintext',
        
        // Other
        '.sql': 'sql',
        '.graphql': 'graphql',
        '.dockerfile': 'dockerfile',
        'dockerfile': 'dockerfile',
        '.makefile': 'makefile',
        'makefile': 'makefile'
    };
    
    // Get the file extension
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) {
        // No extension, try to match by filename
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1).toLowerCase();
        if (extensionMap[fileName]) {
            return extensionMap[fileName];
        }
        return 'plaintext';
    }
    
    const ext = filePath.substring(lastDotIndex).toLowerCase();
    return extensionMap[ext] || 'plaintext';
}

// Escape HTML special characters
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Read file as ArrayBuffer
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsArrayBuffer(file);
    });
}
