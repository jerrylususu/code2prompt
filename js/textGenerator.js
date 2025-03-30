/**
 * Text generation and token counting functionality for the code2prompt application
 */

import { getLanguageFromExtension, escapeHtml } from './utils.js';
import { hasSelectedFiles, repoStructure, toggleFileSelection } from './fileTree.js';

// Variables
export let resultText = '';

// Calculate file token count (base tokens for content only, without markdown structure)
export function calculateFileTokenCount(content) {
    if (window.gpt3) {
        return window.gpt3.encode(content).length;
    } else {
        // Fallback: rough estimate based on whitespace-split words
        return Math.ceil(content.split(/\s+/).length * 1.3);
    }
}

// Generate text representation of the repository
export function generateText() {
    console.log('Generating text representation');
    
    // Get selected files
    const selectedFiles = window.repoFiles.filter(file => file.selected);
    
    if (selectedFiles.length === 0) {
        alert('Please select at least one file');
        return;
    }
    
    // Generate outline
    const outline = generateOutline(repoStructure);
    
    // Generate file contents
    let fileContents = '';
    
    for (const file of selectedFiles) {
        const language = getLanguageFromExtension(file.path);
        
        const fileText = generateCodeBlockText(file.path, language, file.content);
        fileContents += fileText;
    }
    
    // Combine outline and file contents
    resultText = `# Repository Structure\n\n${outline}\n\n# Files\n${fileContents}`;
    window.resultText = resultText;
    
    // Display result
    displayResult();
    
    // Show result section
    document.getElementById('result-section').classList.remove('hidden');
    
    // Update token count
    const tokenCount = updateEstimatedTokenCount();
    document.getElementById('token-estimate').textContent = `Estimated tokens: ${tokenCount.toLocaleString()}`;
    
    console.log('Text generation complete');
}

// Generate outline of repository structure
function generateOutline(structure, indent = '', isLast = true, parentPrefixes = []) {
    let outline = '';
    
    // Sort keys: folders first, then files
    const keys = Object.keys(structure).filter(key => !key.startsWith('_'));
    
    keys.sort((a, b) => {
        const aIsFolder = structure[a]._type === 'folder';
        const bIsFolder = structure[b]._type === 'folder';
        
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        
        return a.localeCompare(b);
    });
    
    // Build outline
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const node = structure[key];
        const isLastItem = i === keys.length - 1;
        
        // Create the current line prefix
        let linePrefix = '';
        for (const prefix of parentPrefixes) {
            linePrefix += prefix;
        }
        
        // Add the branch symbol
        if (indent !== '') {
            linePrefix += isLastItem ? '└── ' : '├── ';
        }
        
        if (node._type === 'folder') {
            outline += `${linePrefix}${key}/\n`;
            
            // Create new prefix for children
            const newParentPrefixes = [...parentPrefixes];
            if (indent !== '') {
                newParentPrefixes.push(isLastItem ? '    ' : '│   ');
            }
            
            outline += generateOutline(node, indent + '  ', isLastItem, newParentPrefixes);
        } else if (node._selected) {
            outline += `${linePrefix}${key}\n`;
        }
    }
    
    return outline;
}

// Generate formatted code block text with proper markup
function generateCodeBlockText(path, language, content) {
    return `\n\n<code path="${path}">\n\`\`\`${language}\n${content}\n\`\`\`\n</code>`;
}

// Display the result with syntax highlighting
export function displayResult() {
    console.log('Displaying result');
    
    const resultDisplay = document.getElementById('result-display');
    if (!resultDisplay) {
        console.error('Result display element not found');
        return;
    }
    
    // Basic HTML escaping for special characters
    const escapedText = resultText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Display the escaped text in a pre block
    resultDisplay.innerHTML = `<pre>${escapedText}</pre>`;
    
    // Update token count in the result section
    const resultTokenEstimate = document.querySelector('#result-section #token-estimate');
    if (resultTokenEstimate) {
        const tokenCount = estimateTokenCount(resultText);
        let tokenText = `Estimated tokens: ${tokenCount.toLocaleString()}`;
        
        // Add fallback indicator if using fallback method
        if (window.usingTokenFallback) {
            tokenText += ' (estimated by length)';
        }
        
        resultTokenEstimate.textContent = tokenText;
    }
    
    console.log('Result displayed');
}

// Estimate token count using gpt-tokenizer or fallback
export function estimateTokenCount(text) {
    // Track if we're using the fallback method
    let usingFallback = false;
    
    try {
        // Check if gpt-tokenizer is available
        if (window.gptTokenizerEncode) {
            // Use the stored reference to the encode function
            return window.gptTokenizerEncode(text).length;
        } else if (window.GPTTokenizer_cl100k_base && typeof window.GPTTokenizer_cl100k_base.encode === 'function') {
            // Direct access to the tokenizer
            return window.GPTTokenizer_cl100k_base.encode(text).length;
        } else {
            usingFallback = true;
            console.error('GPT tokenizer not available, using fallback length-based estimation');
            // Fallback: rough estimate based on whitespace-split words
            return Math.ceil(text.split(/\s+/).length * 1.3);
        }
    } catch (error) {
        usingFallback = true;
        console.error('Error using GPT tokenizer, falling back to length-based estimation:', error);
        // Fallback: rough estimate based on whitespace-split words
        return Math.ceil(text.split(/\s+/).length * 1.3);
    } finally {
        // Store the fallback status in a global variable for UI to use
        window.usingTokenFallback = usingFallback;
    }
}

// Update estimated token count for selected files
export function updateEstimatedTokenCount() {
    // Reset fallback status
    window.usingTokenFallback = false;
    
    // Get selected files
    const selectedFiles = window.repoFiles.filter(file => file.selected);
    
    // Check if selection has changed
    const selectedPaths = selectedFiles.map(f => f.path).sort().join(',');
    if (!window.selectionChanged && window.lastSelectedPaths === selectedPaths && window.lastTotalTokenCount !== undefined) {
        // If selection hasn't changed, use cached token count
        const tokenEstimateElement = document.getElementById('token-estimate');
        if (tokenEstimateElement) {
            let tokenText = `Estimated tokens: ${window.lastTotalTokenCount.toLocaleString()}`;
            
            // Add fallback indicator if using fallback method
            if (window.usingTokenFallback) {
                tokenText += ' (estimated by length)';
            }
            
            tokenEstimateElement.textContent = tokenText;
        }
        
        return window.lastTotalTokenCount;
    }
    
    // Reset the selection changed flag
    window.selectionChanged = false;
    
    // Save current selection for future comparison
    window.lastSelectedPaths = selectedPaths;
    
    // Calculate total token count
    let totalTokenCount = 0;
    
    // Add tokens for repository structure
    const outline = generateOutline(repoStructure);
    const structureText = `# Repository Structure\n\n${outline}\n\n# Files`;
    totalTokenCount += estimateTokenCount(structureText);
    
    // Add tokens for selected files
    for (const file of selectedFiles) {
        // Use the cached base token count if available
        if (!file.baseTokenCount) {
            file.baseTokenCount = calculateFileTokenCount(file.content);
        }
        
        // Calculate the total token count including the markdown structure
        const language = getLanguageFromExtension(file.path);
        const fileText = generateCodeBlockText(file.path, language, file.content);
        
        // Use cached token count if available
        let totalFileTokens;
        if (file.tokenCount) {
            totalFileTokens = file.tokenCount;
        } else {
            totalFileTokens = estimateTokenCount(fileText);
            // Cache the total token count
            file.tokenCount = totalFileTokens;
        }
        
        totalTokenCount += totalFileTokens;
    }
    
    // Cache the calculated token count
    window.lastTotalTokenCount = totalTokenCount;
    
    // Update token count display
    const tokenEstimateElement = document.getElementById('token-estimate');
    if (tokenEstimateElement) {
        let tokenText = `Estimated tokens: ${totalTokenCount.toLocaleString()}`;
        
        // Add fallback indicator if using fallback method
        if (window.usingTokenFallback) {
            tokenText += ' (estimated by length)';
        }
        
        tokenEstimateElement.textContent = tokenText;
    }
    
    return totalTokenCount;
}

// Update top token files display
export function updateTopTokenFiles() {
    console.log('Updating top token files display');
    
    const topTokenFilesElement = document.getElementById('top-token-files');
    if (!topTokenFilesElement) {
        console.error('Top token files element not found');
        return;
    }
    
    // Get selected files
    const selectedFiles = window.repoFiles.filter(file => file.selected && !file.binary);
    console.log(`Found ${selectedFiles.length} selected files`);
    
    // Use cached token counts where available
    for (const file of selectedFiles) {
        // Ensure base token count is calculated and cached
        if (!file.baseTokenCount) {
            file.baseTokenCount = calculateFileTokenCount(file.content);
            console.log(`Calculated base token count for ${file.path}: ${file.baseTokenCount}`);
        }
        
        // If the total token count isn't calculated yet or selection changed, calculate it now
        if (!file.tokenCount || window.selectionChanged) {
            const language = getLanguageFromExtension(file.path);
            const fileText = generateCodeBlockText(file.path, language, file.content);
            file.tokenCount = estimateTokenCount(fileText);
            console.log(`Calculated total token count for ${file.path}: ${file.tokenCount}`);
        }
    }
    
    // Sort files by token count (descending)
    selectedFiles.sort((a, b) => b.tokenCount - a.tokenCount);
    
    // Take top 10 files
    const topFiles = selectedFiles.slice(0, 10);
    console.log(`Top ${topFiles.length} files by token count:`, topFiles.map(f => `${f.path}: ${f.tokenCount}`));
    
    // Check if the top files have changed - if not, don't redraw
    if (!window.selectionChanged && 
        window.lastTopFiles && 
        JSON.stringify(topFiles.map(f => f.path)) === JSON.stringify(window.lastTopFiles.map(f => f.path))) {
        console.log('Top files unchanged, skipping redraw');
        return;
    }
    
    // Save current top files for future comparison
    window.lastTopFiles = [...topFiles];
    
    // Clear existing content
    topTokenFilesElement.innerHTML = '';
    
    // Create list
    const list = document.createElement('ul');
    list.className = 'top-token-files-list';
    
    // Add files to list
    for (const file of topFiles) {
        const listItem = document.createElement('li');
        listItem.className = 'top-token-file-item';
        
        // Create file info
        const fileInfo = document.createElement('div');
        fileInfo.className = 'top-token-file-info';
        
        // Create file path
        const filePath = document.createElement('span');
        filePath.className = 'top-token-file-path';
        filePath.textContent = file.path;
        filePath.title = file.path;
        filePath.addEventListener('click', () => showFileInEditor(file.path));
        
        // Create token count
        const tokenCount = document.createElement('span');
        tokenCount.className = 'top-token-file-tokens';
        tokenCount.textContent = `${file.tokenCount.toLocaleString()} tokens`;
        
        // Create deselect button
        const deselectButton = document.createElement('button');
        deselectButton.className = 'top-token-file-deselect';
        deselectButton.textContent = '✕';
        deselectButton.title = 'Deselect file';
        deselectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Deselect button clicked for ${file.path}`);
            deselectFile(file.path);
        });
        
        // Add elements to file info
        fileInfo.appendChild(filePath);
        fileInfo.appendChild(tokenCount);
        fileInfo.appendChild(deselectButton);
        
        // Add file info to list item
        listItem.appendChild(fileInfo);
        
        // Add list item to list
        list.appendChild(listItem);
    }
    
    // Add list to top token files element
    topTokenFilesElement.appendChild(list);
    
    console.log('Top token files display updated');
}

// Copy to clipboard
export function copyToClipboard() {
    if (!resultText) {
        alert('No text to copy');
        return;
    }
    
    // Copy text to clipboard
    navigator.clipboard.writeText(resultText).then(() => {
        alert('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text');
    });
}

// Download as text file
export function downloadAsText() {
    if (!resultText) {
        alert('No text to download');
        return;
    }
    
    // Create blob
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    
    // Download file
    saveAs(blob, 'code2prompt.txt');
}

// Deselect a file by path
export function deselectFile(filePath) {
    console.log('Deselecting file from top token files list:', filePath);
    
    // Get the file to log its token count
    const file = window.repoFiles.find(f => f.path === filePath);
    if (file) {
        console.log(`File token count: ${file.tokenCount}, base token count: ${file.baseTokenCount}`);
        
        // Mark the selection as changed to invalidate token count cache
        window.selectionChanged = true;
    }
    
    // Use the existing toggleFileSelection function to handle deselection
    toggleFileSelection(filePath, false);
    
    console.log('File deselected, updating UI');
}
