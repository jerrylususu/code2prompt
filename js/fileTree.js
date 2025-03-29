/**
 * File tree functionality for the code2prompt application
 */

import { isBinaryFile } from './utils.js';
import { showFileInEditor } from './editorHandler.js';
import { updateEstimatedTokenCount, updateTopTokenFiles, calculateFileTokenCount } from './textGenerator.js';

// Variables
export let repoStructure = {};

// Build file tree structure from flat file list
export function buildFileTreeStructure() {
    // Get repoFiles from the window global
    const repoFiles = window.repoFiles || [];
    
    console.log('Building file tree structure with', repoFiles.length, 'files in fileTree.js');
    
    // Reset structure
    repoStructure = {};
    
    // Build structure
    for (const file of repoFiles) {
        // Skip binary files completely
        if (file.binary) {
            continue;
        }
        
        const path = file.path;
        const parts = path.split('/');
        
        let current = repoStructure;
        
        // Build folder structure
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {
                    _type: 'folder',
                    _path: parts.slice(0, i + 1).join('/'),
                    _selected: true,
                    _indeterminate: false,
                    _tokenCount: 0,
                    _selectedTokenCount: 0
                };
            }
            current = current[part];
        }
        
        // Add file
        const fileName = parts[parts.length - 1];
        
        // Use cached token count if available
        let tokenCount;
        if (file.baseTokenCount) {
            tokenCount = file.baseTokenCount;
        } else {
            // Calculate base token count if not already calculated
            file.baseTokenCount = calculateFileTokenCount(file.content);
            tokenCount = file.baseTokenCount;
        }
        
        current[fileName] = {
            _type: 'file',
            _path: path,
            _selected: file.selected,
            _binary: file.binary,
            _size: file.size,
            _content: file.content,
            _tokenCount: tokenCount
        };
    }
    
    // Calculate folder token counts
    calculateTotalTokenCounts(repoStructure);
    calculateSelectedTokenCounts(repoStructure);
    
    console.log('File tree structure built:', Object.keys(repoStructure).length, 'root items');
    return repoStructure;
}

// Render file tree from structure
export function renderFileTree() {
    const fileTreeElement = document.getElementById('file-tree');
    if (!fileTreeElement) {
        console.error('File tree element not found');
        return;
    }
    
    console.log('Rendering file tree with structure:', Object.keys(repoStructure).length, 'root items');
    
    // Clear existing content
    fileTreeElement.innerHTML = '';
    
    // Build tree
    buildTreeNode(fileTreeElement, repoStructure, '');
    
    // Update folder checkboxes
    updateFolderCheckboxes();
    
    // Recalculate folder token counts
    recalculateFolderTokenCounts();
    
    // Calculate token counts for all files
    updateEstimatedTokenCount();
    
    // Update top token files display
    updateTopTokenFiles();
    
    console.log('File tree rendered');
}

// Build tree node
function buildTreeNode(parentElement, node, path) {
    // Sort keys to ensure folders come before files
    const keys = Object.keys(node).filter(key => !key.startsWith('_')).sort((a, b) => {
        const aIsFolder = node[a]._type === 'folder';
        const bIsFolder = node[b]._type === 'folder';
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.localeCompare(b);
    });
    
    // Create list
    const list = document.createElement('ul');
    list.className = 'file-tree-list';
    
    // Add items
    for (const key of keys) {
        const item = node[key];
        const itemPath = path ? `${path}/${key}` : key;
        
        // Create list item
        const li = document.createElement('li');
        li.className = 'file-tree-item';
        
        // Create item container
        const itemContainer = document.createElement('div');
        itemContainer.className = 'file-tree-item-container';
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-tree-checkbox';
        checkbox.checked = item._selected;
        checkbox.dataset.path = itemPath;
        checkbox.addEventListener('change', () => toggleFileSelection(itemPath, checkbox.checked));
        
        // Create label
        const label = document.createElement('span');
        label.className = 'file-tree-label';
        
        // Add icon and text based on type
        if (item._type === 'folder') {
            // For folders, display name and token counts separately
            label.innerHTML = `📁${key}`;
            label.className += ' file-tree-folder';
            label.addEventListener('click', () => toggleFolder(li));
            
            // Add token count as a separate span element
            const selectedTokens = item._selectedTokenCount.toLocaleString();
            const totalTokens = item._tokenCount.toLocaleString();
            const tokenCountSpan = document.createElement('span');
            tokenCountSpan.className = 'token-count';
            tokenCountSpan.textContent = `${selectedTokens}/${totalTokens} tokens`;
            label.appendChild(tokenCountSpan);
        } else {
            // For files, display name and token count
            label.innerHTML = `📄${key}`;
            label.className += ' file-tree-file';
            label.addEventListener('click', () => showFileInEditor(item._path));
            
            // Add token count and size as separate span elements
            const tokenCount = item._tokenCount.toLocaleString();
            const sizeInKB = (item._size / 1024).toFixed(2);
            
            const tokenCountSpan = document.createElement('span');
            tokenCountSpan.className = 'token-count';
            tokenCountSpan.textContent = `${tokenCount} tokens`;
            label.appendChild(tokenCountSpan);
            
            const fileSizeSpan = document.createElement('span');
            fileSizeSpan.className = 'file-size';
            fileSizeSpan.textContent = `${sizeInKB} KB`;
            label.appendChild(fileSizeSpan);
        }
        
        // Add checkbox and label to container
        itemContainer.appendChild(checkbox);
        itemContainer.appendChild(label);
        
        // Add container to list item
        li.appendChild(itemContainer);
        
        // Add to list
        list.appendChild(li);
        
        // Recursively build children for folders
        if (item._type === 'folder') {
            buildTreeNode(li, item, itemPath);
        }
    }
    
    // Add list to parent
    if (keys.length > 0) {
        parentElement.appendChild(list);
    }
}

// Update folder checkboxes based on their children's state
function updateFolderCheckboxes() {
    // Start from the deepest level
    const checkboxes = document.querySelectorAll('.file-tree-checkbox');
    const checkboxArray = Array.from(checkboxes);
    
    // Sort by path depth (deepest first)
    checkboxArray.sort((a, b) => {
        const aDepth = a.dataset.path.split('/').length;
        const bDepth = b.dataset.path.split('/').length;
        return bDepth - aDepth;
    });
    
    // Process each folder
    for (const checkbox of checkboxArray) {
        const path = checkbox.dataset.path;
        const node = getNodeByPath(path);
        
        if (node._type === 'folder') {
            const children = getFolderChildren(node);
            const selectedChildren = children.filter(child => child._selected);
            
            // Update checkbox state
            checkbox.checked = selectedChildren.length > 0;
            checkbox.indeterminate = selectedChildren.length > 0 && 
                                    selectedChildren.length < children.length;
            
            // Ensure token count never goes negative
            node._selectedTokenCount = Math.max(0, node._selectedTokenCount);
        }
    }
}

// Toggle file selection
export function toggleFileSelection(path, selected, skipRender = false) {
    console.log(`Toggling file selection for ${path}, selected: ${selected}, skipRender: ${skipRender}`);
    
    const node = getNodeByPath(path);
    if (!node) {
        console.error(`Node not found for path: ${path}`);
        return;
    }

    // Update selection state
    node._selected = selected;
    
    // Sync with window.repoFiles
    if (node._type === 'file') {
        const repoFile = window.repoFiles.find(f => f.path === path);
        if (repoFile) {
            repoFile.selected = selected;
            
            // Mark the selection as changed to invalidate token count cache
            window.selectionChanged = true;
        }
    }
    
    // For folders, recursively update children
    if (node._type === 'folder') {
        updateStructureSelection(node, selected);
    }
    
    // Recalculate all folder token counts
    recalculateFolderTokenCounts();
    
    // Update UI and token counts only if not skipping render
    if (!skipRender) {
        // Update file tree selection state
        updateFileTreeSelectionState();
    }
}

// Update structure selection (recursive)
function updateStructureSelection(node, selected) {
    if (!node) return;
    
    // Update current node
    node._selected = selected;
    node._indeterminate = false;
    
    // Get all non-underscore keys (actual files/folders)
    const keys = Object.keys(node).filter(key => !key.startsWith('_'));
    
    // Recursively update all children
    for (const key of keys) {
        const child = node[key];
        if (child._type === 'folder') {
            updateStructureSelection(child, selected);
        } else if (child._type === 'file') {
            child._selected = selected;
            // Update repoFiles selection state
            const repoFile = window.repoFiles.find(f => f.path === child._path);
            if (repoFile) {
                repoFile.selected = selected;
            }
        }
    }
}

// Recalculate folder token counts based on selected files
function recalculateFolderTokenCounts() {
    console.log('Recalculating folder token counts');
    
    // First calculate total token counts for all folders
    calculateTotalTokenCounts(repoStructure);
    
    // Then calculate selected token counts
    calculateSelectedTokenCounts(repoStructure);
    
    // Update the UI to reflect the changes
    updateFolderTokenCounts();
}

// Calculate total token counts for all folders
function calculateTotalTokenCounts(node) {
    if (!node || typeof node !== 'object') return 0;
    
    let totalTokens = 0;
    
    // Get all non-underscore keys (actual files/folders)
    const keys = Object.keys(node).filter(key => !key.startsWith('_'));
    
    for (const key of keys) {
        const child = node[key];
        if (child._type === 'file') {
            totalTokens += child._tokenCount;
        } else if (child._type === 'folder') {
            child._tokenCount = calculateTotalTokenCounts(child);
            totalTokens += child._tokenCount;
        }
    }
    
    if (node._type === 'folder') {
        node._tokenCount = totalTokens;
    }
    
    return totalTokens;
}

// Calculate selected token counts for all folders
function calculateSelectedTokenCounts(node) {
    if (!node || typeof node !== 'object') return 0;
    
    let selectedTokens = 0;
    
    // Get all non-underscore keys (actual files/folders)
    const keys = Object.keys(node).filter(key => !key.startsWith('_'));
    
    for (const key of keys) {
        const child = node[key];
        if (child._type === 'file' && child._selected) {
            selectedTokens += child._tokenCount;
        } else if (child._type === 'folder') {
            child._selectedTokenCount = calculateSelectedTokenCounts(child);
            selectedTokens += child._selectedTokenCount;
        }
    }
    
    if (node._type === 'folder') {
        node._selectedTokenCount = selectedTokens;
    }
    
    return selectedTokens;
}

// Optimized version of renderFileTree that only updates what's necessary
export function updateFileTreeSelectionState() {
    console.log('Updating file tree selection state');
    
    const checkboxes = document.querySelectorAll('.file-tree-checkbox');
    
    // Update checkbox states based on the current structure
    for (const checkbox of checkboxes) {
        const path = checkbox.dataset.path;
        const node = getNodeByPath(path);
        
        if (node) {
            checkbox.checked = node._selected;
            
            // For folders, check if it should be indeterminate
            if (node._type === 'folder') {
                const children = getFolderChildren(node);
                const selectedChildren = children.filter(child => child._selected);
                checkbox.indeterminate = selectedChildren.length > 0 && 
                                        selectedChildren.length < children.length;
            }
        }
    }
    
    // Update folder checkboxes
    updateFolderCheckboxes();
    
    // Update token counts
    updateEstimatedTokenCount();
    
    // Update top token files display
    updateTopTokenFiles();
}

// Update folder token counts in the UI
function updateFolderTokenCounts() {
    const folderLabels = document.querySelectorAll('.file-tree-folder');
    
    for (const label of folderLabels) {
        const container = label.closest('.file-tree-item-container');
        if (!container) continue;
        
        const checkbox = container.querySelector('.file-tree-checkbox');
        if (!checkbox) continue;
        
        const path = checkbox.dataset.path;
        const node = getNodeByPath(path);
        
        if (node && node._type === 'folder') {
            // Find the token count span
            let tokenCountSpan = label.querySelector('.token-count');
            
            // If token count span doesn't exist, create it
            if (!tokenCountSpan) {
                tokenCountSpan = document.createElement('span');
                tokenCountSpan.className = 'token-count';
                label.appendChild(tokenCountSpan);
            }
            
            // Update the token count display
            const selectedTokens = node._selectedTokenCount.toLocaleString();
            const totalTokens = node._tokenCount.toLocaleString();
            tokenCountSpan.textContent = `${selectedTokens}/${totalTokens} tokens`;
        }
    }
}

// Get node by path
function getNodeByPath(path) {
    if (!path) return null;
    const parts = path.split('/');
    let current = repoStructure;
    for (const part of parts) {
        if (!current[part]) return null;
        current = current[part];
    }
    return current;
}

// Get folder children
function getFolderChildren(folder) {
    const children = [];
    for (const key in folder) {
        if (!key.startsWith('_')) {
            children.push(folder[key]);
        }
    }
    return children;
}

// Toggle folder expansion
function toggleFolder(folderElement) {
    const list = folderElement.querySelector('ul');
    if (list) {
        list.classList.toggle('hidden');
        
        // Toggle folder icon
        const label = folderElement.querySelector('.file-tree-folder');
        if (label) {
            if (list.classList.contains('hidden')) {
                label.classList.add('collapsed');
            } else {
                label.classList.remove('collapsed');
            }
        }
    }
}

// Toggle all files
export function toggleAllFiles(selected) {
    // Update all files in repoFiles
    for (const file of window.repoFiles) {
        // Skip binary files
        if (!file.binary) {
            file.selected = selected;
        }
    }
    
    // Update structure
    updateStructureSelection(repoStructure, selected);
    
    // Recalculate folder token counts
    recalculateFolderTokenCounts();
    
    // Update file tree
    updateFileTreeSelectionState();
    
    // Update token counts
    updateEstimatedTokenCount();
    
    // Update top token files display
    updateTopTokenFiles();
    
    // Mark selection as changed
    window.selectionChanged = true;
}

// Invert selection
export function invertSelection() {
    // Invert selection for all files in repoFiles
    for (const file of window.repoFiles) {
        // Skip binary files
        if (!file.binary) {
            file.selected = !file.selected;
        }
    }
    
    // Invert selection in structure
    invertStructureSelection(repoStructure);
    
    // Recalculate folder token counts
    recalculateFolderTokenCounts();
    
    // Update file tree
    updateFileTreeSelectionState();
    
    // Update token counts
    updateEstimatedTokenCount();
    
    // Update top token files display
    updateTopTokenFiles();
    
    // Mark selection as changed
    window.selectionChanged = true;
}

// Invert structure selection (recursive)
function invertStructureSelection(node) {
    for (const key in node) {
        if (key.startsWith('_')) {
            if (key === '_selected' && node._type === 'file') {
                node[key] = !node[key];
            }
        } else {
            invertStructureSelection(node[key]);
        }
    }
}

// Check if there are any selected files
export function hasSelectedFiles() {
    return window.repoFiles.some(file => file.selected);
}
