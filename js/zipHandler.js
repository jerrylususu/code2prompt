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
        let tokenizedFiles = 0;
        
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
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 40);
                continue;
            }
            
            // Skip hidden files and directories
            if (isHiddenPath(path)) {
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 40);
                continue;
            }
            
            // Check if it's a binary file
            const isBinary = isBinaryFile(path);
            
            // Skip binary files completely
            if (isBinary) {
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 40);
                continue;
            }
            
            // Process the file
            const promise = zipObj.async('string').then(content => {
                // Keep the original path structure - don't remove root folder
                // This preserves the folder hierarchy
                let normalizedPath = path;
                
                processedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 40);
                
                // Calculate token count for the file
                const baseTokenCount = calculateFileTokenCount(content);
                tokenizedFiles++;
                updateStatus(`Calculating tokens... (${tokenizedFiles}/${totalFiles - Object.values(zip.files).filter(f => f.dir).length})`, 50 + (tokenizedFiles / (totalFiles - Object.values(zip.files).filter(f => f.dir).length)) * 30);
                
                // Add the file to the repository files
                repoFiles.push({
                    path: normalizedPath,
                    content: content,
                    size: content.length,
                    binary: false, // We've already skipped binary files
                    selected: true, // All files are selected by default
                    baseTokenCount: baseTokenCount // Cache the token count
                });
            }).catch(error => {
                console.error(`Error processing file ${path}:`, error);
                processedFiles++;
                tokenizedFiles++;
                updateStatus(`Processing files... (${processedFiles}/${totalFiles})`, 10 + (processedFiles / totalFiles) * 40);
            });
            
            promises.push(promise);
        }
        
        // Wait for all files to be processed
        await Promise.all(promises);
        
        // Sort files by path
        repoFiles.sort((a, b) => a.path.localeCompare(b.path));
        
        // Build file tree structure
        updateStatus('Building file tree...', 90);
        buildFileTreeStructure();
        
        // Render file tree
        updateStatus('Rendering file tree...', 95);
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

// Create a zip of the project itself and load it as an example
export async function loadProjectAsExample() {
    try {
        // Show status section
        document.getElementById('status-section').classList.remove('hidden');
        document.getElementById('progress-container').classList.remove('hidden');
        updateStatus('Creating example from current project...', 0);
        
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // First, fetch and parse the index.html to find all script and style imports
        updateStatus('Analyzing project structure...', 5);
        const indexResponse = await fetch('index.html');
        if (!indexResponse.ok) {
            throw new Error(`Failed to fetch index.html: ${indexResponse.status} ${indexResponse.statusText}`);
        }
        
        const indexHtml = await indexResponse.text();
        
        // Add index.html to the zip
        zip.file('index.html', indexHtml);
        
        // Parse the HTML to find all local script and style imports
        const parser = new DOMParser();
        const doc = parser.parseFromString(indexHtml, 'text/html');
        
        // Get all script tags
        const scriptTags = Array.from(doc.querySelectorAll('script[src]'));
        const styleTags = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
        
        // Filter to only include local files (not CDN)
        const localScripts = scriptTags
            .map(script => script.getAttribute('src'))
            .filter(src => !src.startsWith('http') && !src.startsWith('//'));
            
        const localStyles = styleTags
            .map(link => link.getAttribute('href'))
            .filter(href => !href.startsWith('http') && !href.startsWith('//'));
        
        // Combine all files to fetch
        const filesToFetch = [...localScripts, ...localStyles];
        
        // Keep track of processed files and files to process
        const processedFiles = new Set();
        const filesToProcess = new Set(filesToFetch);
        
        // Process files and discover imports recursively
        while (filesToProcess.size > 0) {
            const currentBatch = Array.from(filesToProcess);
            filesToProcess.clear();
            
            updateStatus(`Discovering project files... (${processedFiles.size} found)`, 10);
            
            // Process each file in the current batch
            for (const filePath of currentBatch) {
                // Skip if already processed
                if (processedFiles.has(filePath)) continue;
                
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        console.warn(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
                        continue;
                    }
                    
                    const content = await response.text();
                    
                    // Add file to zip with proper folder structure
                    // Create folders explicitly
                    if (filePath.includes('/')) {
                        const folders = filePath.split('/');
                        folders.pop(); // Remove the file name
                        let folderPath = '';
                        
                        // Create each folder in the path
                        for (const folder of folders) {
                            folderPath += folder + '/';
                            zip.folder(folderPath);
                        }
                    }

                    zip.file(filePath, content);

                    // Mark as processed
                    processedFiles.add(filePath);
                    
                    // If it's a JavaScript file, look for imports
                    if (filePath.endsWith('.js')) {
                        // Find import statements
                        const importMatches = content.matchAll(/import\s+(?:.+\s+from\s+)?['"](.+)['"]/g);
                        
                        for (const match of importMatches) {
                            const importPath = match[1];
                            
                            // Only process relative imports
                            if (!importPath.startsWith('http') && !importPath.startsWith('//')) {
                                // Resolve the path relative to the current file
                                const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
                                let resolvedPath = importPath;
                                
                                // Handle relative paths
                                if (importPath.startsWith('./')) {
                                    resolvedPath = basePath + importPath.substring(2);
                                } else if (importPath.startsWith('../')) {
                                    // Simple path resolution for ../
                                    const parts = basePath.split('/');
                                    parts.pop(); // Remove the last part
                                    parts.pop(); // Go up one level
                                    resolvedPath = parts.join('/') + '/' + importPath.substring(3);
                                } else if (!importPath.startsWith('/')) {
                                    resolvedPath = basePath + importPath;
                                }
                                
                                // Add to files to process if not already processed
                                if (!processedFiles.has(resolvedPath)) {
                                    filesToProcess.add(resolvedPath);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing ${filePath}:`, error);
                }
            }
            
            updateStatus(`Discovered ${processedFiles.size} project files...`, 20);
        }
        
        updateStatus(`Creating ZIP with ${processedFiles.size} files...`, 50);
        
        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        }, (metadata) => {
            updateStatus(`Creating ZIP file... ${Math.round(metadata.percent)}%`, 50 + (metadata.percent * 0.3));
        });
        
        updateStatus('Processing example ZIP...', 80);
        
        // Convert the blob to an ArrayBuffer
        const arrayBuffer = await zipBlob.arrayBuffer();
        
        // Convert ArrayBuffer to Uint8Array
        const zipData = new Uint8Array(arrayBuffer);
        
        // Process the ZIP file
        await processZipData(zipData);
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 0);
        console.error('Load example error:', error);
    }
}
