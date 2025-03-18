/**
 * ZIP file handling functionality for the code2prompt application
 */

import { formatBytes, formatSpeed, isHiddenPath, isBinaryFile, readFileAsArrayBuffer } from './utils.js';
import { updateStatus } from './uiHelpers.js';
import { buildFileTreeStructure, renderFileTree } from './fileTree.js';
import { calculateFileTokenCount } from './textGenerator.js';

// Variables
export let repoFiles = [];

// Handle ZIP file upload
export async function handleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Show status section
        document.getElementById('status-section').classList.remove('hidden');
        document.getElementById('progress-container').classList.remove('hidden');
        updateStatus(`Processing uploaded file: ${file.name}`, 0);
        
        // Read the file as an ArrayBuffer
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // Convert ArrayBuffer to Uint8Array
        const zipData = new Uint8Array(arrayBuffer);
        
        // Process the ZIP file
        await processZipData(zipData);
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 0);
        console.error('Upload error:', error);
    }
}

// Process ZIP data (common for both download and upload)
export async function processZipData(zipData) {
    try {
        updateStatus('Extracting ZIP file...', 10);
        
        // Load the ZIP file
        const zip = await JSZip.loadAsync(zipData);
        
        // Get the total number of files for progress tracking
        const totalFiles = Object.keys(zip.files).length;
        let processedFiles = 0;
        
        // Reset repository files
        repoFiles = [];
        window.repoFiles = repoFiles; // Make sure window.repoFiles references the same array
        
        // Reset selection changed flag
        window.selectionChanged = true;
        
        // Process each file in the ZIP
        const promises = [];
        
        // Find the root folder name (if any)
        let rootFolder = '';
        for (const path in zip.files) {
            if (path.indexOf('/') !== -1) {
                const possibleRoot = path.substring(0, path.indexOf('/'));
                if (possibleRoot && !rootFolder) {
                    rootFolder = possibleRoot + '/';
                }
                break;
            }
        }
        
        for (const path in zip.files) {
            const zipObj = zip.files[path];
            
            // Skip directories
            if (zipObj.dir) {
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 80);
                continue;
            }
            
            // Skip hidden files and directories
            if (isHiddenPath(path)) {
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 80);
                continue;
            }
            
            // Process the file
            const promise = zipObj.async('string').then(content => {
                // Remove the root folder from the path if it exists
                let normalizedPath = path;
                if (rootFolder && path.startsWith(rootFolder)) {
                    normalizedPath = path.substring(rootFolder.length);
                }
                
                // Calculate token count for the file
                const baseTokenCount = calculateFileTokenCount(content);
                
                // Add the file to the repository files
                repoFiles.push({
                    path: normalizedPath,
                    content: content,
                    size: content.length,
                    binary: isBinaryFile(normalizedPath),
                    selected: !isBinaryFile(normalizedPath), // Pre-select non-binary files
                    baseTokenCount: baseTokenCount // Cache the token count
                });
                
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 80);
            }).catch(error => {
                console.error(`Error processing file ${path}:`, error);
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 80);
            });
            
            promises.push(promise);
        }
        
        // Wait for all files to be processed
        await Promise.all(promises);
        
        // Sort files by path
        repoFiles.sort((a, b) => a.path.localeCompare(b.path));
        
        // Build file tree structure
        updateStatus('Building file tree...', 90);
        console.log('Building file tree structure with', repoFiles.length, 'files');
        buildFileTreeStructure();
        
        // Render file tree
        updateStatus('Rendering file tree...', 95);
        console.log('Rendering file tree');
        renderFileTree();
        
        // Show file tree section
        document.getElementById('file-tree-section').classList.remove('hidden');
        
        // Show top token files section
        document.getElementById('top-token-files-section').classList.remove('hidden');
        
        // Hide progress bar
        document.getElementById('progress-container').classList.add('hidden');
        
        // Update status
        updateStatus(`Successfully processed ${repoFiles.length} files`, 100);
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 0);
        console.error('ZIP processing error:', error);
    }
}
