/**
 * GitHub URL handling functionality for the code2prompt application
 */

import { formatBytes, formatSpeed } from './utils.js';
import { updateStatus } from './uiHelpers.js';
import { processZipData } from './zipHandler.js';

// GitHub URL handling
export async function handleGithubDownload() {
    const githubUrlInput = document.getElementById('github-url');
    const url = githubUrlInput.value.trim();
    if (!url) {
        alert('Please enter a GitHub repository URL');
        return;
    }

    try {
        // Show status section
        document.getElementById('status-section').classList.remove('hidden');
        document.getElementById('progress-container').classList.remove('hidden');
        updateStatus('Preparing to download repository...', 0);

        // Parse GitHub URL to get the download link
        const zipUrl = getGitHubZipUrl(url);
        if (!zipUrl) {
            throw new Error('Invalid GitHub repository URL');
        }

        // Download the ZIP file
        const zipData = await downloadZipFile(zipUrl);
        
        // Process the ZIP file
        await processZipData(zipData);
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 0);
        console.error('Download error:', error);
    }
}

// Parse GitHub URL and convert to ZIP download URL
export function getGitHubZipUrl(url) {
    // Remove trailing slash if present
    url = url.replace(/\/$/, '');
    
    // GitHub URL patterns
    const patterns = [
        /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,                         // https://github.com/user/repo
        /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)$/,         // https://github.com/user/repo/tree/branch
        /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)$/    // https://github.com/user/repo/tree/branch/folder
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const user = match[1];
            const repo = match[2];
            const branch = match[3] || 'main'; // Default to main if no branch specified
            
            return `https://github.com/${user}/${repo}/archive/refs/heads/${branch}.zip`;
        }
    }
    
    return null;
}

// Download ZIP file with progress tracking
export async function downloadZipFile(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        
        // Track download progress
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                const loadedSize = formatBytes(event.loaded);
                const totalSize = formatBytes(event.total);
                const speed = formatSpeed(event.loaded);
                
                updateStatus(
                    `Downloading repository: ${loadedSize} of ${totalSize} ${speed}`, 
                    percentComplete
                );
                
                // Update progress bar
                const progressBar = document.getElementById('progress-bar');
                const progressInfo = document.getElementById('progress-info');
                
                if (progressBar && progressInfo) {
                    progressBar.style.width = `${percentComplete}%`;
                    progressInfo.textContent = `${percentComplete}%`;
                }
            } else {
                // If length is not computable, just show the downloaded size
                const loadedSize = formatBytes(event.loaded);
                const speed = formatSpeed(event.loaded);
                
                updateStatus(
                    `Downloading repository: ${loadedSize} downloaded ${speed}`, 
                    50 // Use 50% as a placeholder
                );
            }
        };
        
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                resolve(new Uint8Array(xhr.response));
            } else {
                reject(new Error(`HTTP error! status: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error occurred'));
        };
        
        xhr.send();
    });
}
