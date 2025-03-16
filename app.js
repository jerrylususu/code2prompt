// Main application code
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const githubUrlInput = document.getElementById('github-url');
    const downloadBtn = document.getElementById('download-btn');
    const zipUploadInput = document.getElementById('zip-upload');
    const statusSection = document.getElementById('status-section');
    const statusMessage = document.getElementById('status-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressInfo = document.getElementById('progress-info');
    const fileTreeSection = document.getElementById('file-tree-section');
    const fileTree = document.getElementById('file-tree');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const invertSelectionBtn = document.getElementById('invert-selection-btn');
    const excludeBinaryFilesCheckbox = document.getElementById('exclude-binary-files');
    const generateBtn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');
    const resultDisplay = document.getElementById('result-display');
    const tokenEstimate = document.getElementById('token-estimate');
    const estimatedTokenCount = document.getElementById('estimated-token-count');
    const copyBtn = document.getElementById('copy-btn');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const editorModal = document.getElementById('editor-modal');
    const editorFileName = document.getElementById('editor-file-name');
    const closeModalBtn = document.querySelector('.close-modal');
    const monacoEditorContainer = document.getElementById('monaco-editor-container');
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    const highlightThemeLink = document.getElementById('highlight-theme');
    const topFilesList = document.getElementById('top-files-list');
    const topFilesSection = document.getElementById('top-files-section');
    const topFilesHeader = document.querySelector('#top-files-section .collapsible-header');
    
    // Variables
    let repoFiles = [];
    let repoStructure = {};
    let resultText = '';
    let monacoEditor = null;
    let monacoEditorLoaded = false;
    
    // Theme handling
    function initTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        
        // Check for system preference if no saved theme
        if (!savedTheme) {
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDarkScheme) {
                document.documentElement.classList.add('dark-theme');
                themeToggleCheckbox.checked = true;
                updateHighlightTheme(true);
            }
        } else if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            themeToggleCheckbox.checked = true;
            updateHighlightTheme(true);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                const isDarkMode = e.matches;
                document.documentElement.classList.toggle('dark-theme', isDarkMode);
                themeToggleCheckbox.checked = isDarkMode;
                updateHighlightTheme(isDarkMode);
                
                // Update Monaco editor theme if it's loaded
                if (monacoEditor) {
                    monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
                }
            }
        });
    }
    
    function updateHighlightTheme(isDark) {
        highlightThemeLink.href = isDark 
            ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.8.0/styles/github-dark.min.css'
            : 'https://cdn.jsdelivr.net/npm/highlight.js@11.8.0/styles/github.min.css';
            
        // Re-highlight any existing code
        if (resultText) {
            displayResult();
        }
    }
    
    // Theme toggle event listener
    if (themeToggleCheckbox) {
        themeToggleCheckbox.addEventListener('change', function() {
            const isDarkMode = this.checked;
            document.documentElement.classList.toggle('dark-theme', isDarkMode);
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update highlight.js theme
            updateHighlightTheme(isDarkMode);
            
            // Update Monaco editor theme if it's loaded
            if (monacoEditor) {
                monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
            }
        });
    }
    
    // Event listeners
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleGithubDownload);
    }
    
    if (zipUploadInput) {
        zipUploadInput.addEventListener('change', handleZipUpload);
    }
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => toggleAllFiles(true));
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => toggleAllFiles(false));
    }
    
    if (invertSelectionBtn) {
        invertSelectionBtn.addEventListener('click', invertSelection);
    }
    
    if (excludeBinaryFilesCheckbox) {
        excludeBinaryFilesCheckbox.addEventListener('change', updateExcludeBinaryFiles);
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateText);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    if (downloadTextBtn) {
        downloadTextBtn.addEventListener('click', downloadAsText);
    }
    
    // GitHub URL handling
    async function handleGithubDownload() {
        const url = githubUrlInput.value.trim();
        if (!url) {
            alert('Please enter a GitHub repository URL');
            return;
        }

        try {
            // Show status section
            statusSection.classList.remove('hidden');
            progressContainer.classList.remove('hidden');
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

    // Handle ZIP file upload
    async function handleZipUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // Show status section
            statusSection.classList.remove('hidden');
            progressContainer.classList.remove('hidden');
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
    
    // Read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // Parse GitHub URL and convert to ZIP download URL
    function getGitHubZipUrl(url) {
        try {
            const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/tree\/([^\/]+))?/;
            const match = url.match(githubRegex);
            
            if (!match) return null;
            
            const [, owner, repo, , branch = 'master'] = match;
            return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
        } catch (error) {
            console.error('Error parsing GitHub URL:', error);
            return null;
        }
    }

    // Download ZIP file with progress tracking
    async function downloadZipFile(url) {
        try {
            updateStatus('Downloading repository ZIP file...', 10);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
            }
            
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;
            
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                
                if (total) {
                    const progress = Math.round((loaded / total) * 100);
                    updateStatus(
                        `Downloading: ${formatBytes(loaded)} of ${formatBytes(total)} (${formatSpeed(loaded)})`, 
                        progress
                    );
                } else {
                    updateStatus(`Downloading: ${formatBytes(loaded)} (${formatSpeed(loaded)})`, 30);
                }
            }
            
            updateStatus('Download complete. Processing ZIP file...', 50);
            
            // Combine chunks into a single Uint8Array
            const chunksAll = new Uint8Array(loaded);
            let position = 0;
            for (const chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            
            return chunksAll;
        } catch (error) {
            console.error('Error downloading ZIP:', error);
            throw new Error(`Failed to download repository: ${error.message}`);
        }
    }

    // Format bytes to human-readable format
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Calculate and format download speed
    let lastLoaded = 0;
    let lastTime = Date.now();
    
    function formatSpeed(loaded) {
        const now = Date.now();
        const timeElapsed = (now - lastTime) / 1000; // in seconds
        
        if (timeElapsed < 0.1) return '...'; // Not enough time has passed
        
        const loadedDiff = loaded - lastLoaded;
        const speed = loadedDiff / timeElapsed; // bytes per second
        
        lastLoaded = loaded;
        lastTime = now;
        
        return formatBytes(speed) + '/s';
    }

    // Process ZIP data (common for both download and upload)
    async function processZipData(zipData) {
        try {
            updateStatus('Extracting ZIP file...', 60);
            
            // Load the ZIP file using JSZip
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(zipData);
            
            updateStatus('Analyzing repository structure...', 70);
            
            // Extract files and build repository structure
            repoFiles = [];
            repoStructure = {};
            
            // Get the root folder name (first directory in the ZIP)
            let rootFolderName = '';
            for (const filename in loadedZip.files) {
                const parts = filename.split('/');
                if (parts.length > 1 && parts[0]) {
                    rootFolderName = parts[0];
                    break;
                }
            }
            
            // Process each file in the ZIP
            const filePromises = [];
            loadedZip.forEach((relativePath, zipEntry) => {
                // Skip directories and hidden files/folders
                if (zipEntry.dir || isHiddenPath(relativePath)) return;
                
                // Remove the root folder name from the path
                let normalizedPath = relativePath;
                if (rootFolderName && normalizedPath.startsWith(rootFolderName + '/')) {
                    normalizedPath = normalizedPath.substring(rootFolderName.length + 1);
                }
                
                // Skip empty paths
                if (!normalizedPath) return;
                
                // Add file to processing queue
                filePromises.push(
                    zipEntry.async('string').then(content => {
                        const isBinary = isBinaryFile(normalizedPath);
                        const tokenCount = isBinary ? 'N/A' : calculateFileTokenCount(content);
                        
                        repoFiles.push({
                            path: normalizedPath,
                            content,
                            selected: !isBinary, // Deselect binary files by default
                            tokenCount: tokenCount
                        });
                    })
                );
            });
            
            // Wait for all files to be processed
            await Promise.all(filePromises);
            
            // Sort files by path
            repoFiles.sort((a, b) => a.path.localeCompare(b.path));
            
            // Build file tree structure
            buildFileTreeStructure();
            
            // Render the file tree
            renderFileTree();
            
            // Show file tree section
            fileTreeSection.classList.remove('hidden');
            
            updateStatus('Repository loaded successfully!', 100);
            
        } catch (error) {
            console.error('Error processing ZIP:', error);
            updateStatus(`Error processing ZIP: ${error.message}`, 0);
        }
    }
    
    // Check if a path is hidden (starts with . or contains /./)
    function isHiddenPath(path) {
        // No longer hiding any paths - all paths will be shown in the file tree
        return false;
        
        /* Original implementation:
        // Check if path is a string
        if (typeof path !== 'string') {
            console.warn('isHiddenPath called with non-string path:', path);
            return false;
        }
        
        // Make an exception for .github folder and its contents
        if (path === '.github' || path.startsWith('.github/')) {
            return false;
        }
        
        const parts = path.split('/');
        return parts.some(part => part.startsWith('.'));
        */
    }
    
    // Check if a file is a binary file based on its extension
    function isBinaryFile(path) {
        // Check if path is a string
        if (typeof path !== 'string') {
            console.warn('isBinaryFile called with non-string path:', path);
            return false;
        }
        
        const extension = path.split('.').pop().toLowerCase();
        
        // Common binary file extensions
        const binaryExtensions = [
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg',
            // Audio
            'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
            // Video
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
            // Executables and binaries
            'exe', 'dll', 'so', 'dylib', 'bin', 'dat',
            // Archives
            'zip', 'rar', 'tar', 'gz', '7z',
            // Documents
            'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'
        ];
        
        return binaryExtensions.includes(extension);
    }
    
    // Build file tree structure from flat file list
    function buildFileTreeStructure() {
        repoStructure = {};
        
        // First pass: build the tree structure
        repoFiles.forEach(file => {
            const parts = file.path.split('/');
            let current = repoStructure;
            
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {
                        __tokenCount: 0,       // Total token count
                        __selectedTokenCount: 0 // Selected token count
                    };
                }
                current = current[part];
            }
            
            const fileName = parts[parts.length - 1];
            current[fileName] = file.path; // Store file path, not content
        });
        
        // Second pass: calculate token counts for folders
        repoFiles.forEach(file => {
            if (file.tokenCount !== 'N/A') {
                const parts = file.path.split('/');
                let current = repoStructure;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    current = current[part];
                    // Add token count to folder total
                    if (current.__tokenCount !== undefined) {
                        current.__tokenCount += file.tokenCount;
                        // Add to selected count if file is selected
                        if (file.selected) {
                            current.__selectedTokenCount += file.tokenCount;
                        }
                    }
                }
            }
        });
    }
    
    // Render file tree from structure
    function renderFileTree() {
        fileTree.innerHTML = '';
        const rootUl = document.createElement('ul');
        
        // Recursively build the tree
        buildTreeNode(rootUl, repoStructure, '');
        
        fileTree.appendChild(rootUl);
        
        // Add event listeners to checkboxes
        const checkboxes = fileTree.querySelectorAll('input[type="checkbox"][data-path]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const filePath = e.target.getAttribute('data-path');
                const fileObj = repoFiles.find(f => f.path === filePath);
                
                if (fileObj) {
                    fileObj.selected = e.target.checked;
                }
                
                // Update estimated token count
                updateEstimatedTokenCount();
                
                // Update folder selected token counts
                updateFolderSelectedTokenCounts();
            });
        });
        
        // Add event listeners to folder checkboxes
        const folderCheckboxes = fileTree.querySelectorAll('.folder-checkbox');
        folderCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const folderPath = e.target.getAttribute('data-folder');
                
                // Get all file checkboxes in this folder
                const childFileCheckboxes = fileTree.querySelectorAll(`input[type="checkbox"][data-path^="${folderPath}/"]`);
                childFileCheckboxes.forEach(childCheckbox => {
                    childCheckbox.checked = isChecked;
                    
                    // Update file selection state
                    const filePath = childCheckbox.getAttribute('data-path');
                    if (filePath) {
                        const fileObj = repoFiles.find(f => f.path === filePath);
                        if (fileObj) {
                            fileObj.selected = isChecked;
                        }
                    }
                });
                
                // Get all folder checkboxes in this folder
                const childFolderCheckboxes = fileTree.querySelectorAll(`.folder-checkbox[data-folder^="${folderPath}/"]`);
                childFolderCheckboxes.forEach(childCheckbox => {
                    childCheckbox.checked = isChecked;
                    childCheckbox.indeterminate = false;
                });
                
                // Update parent folders
                updateParentFolders(e.target);
                
                // Update estimated token count
                updateEstimatedTokenCount();
                
                // Update folder selected token counts
                updateFolderSelectedTokenCounts();
            });
        });
        
        updateEstimatedTokenCount();
    }
    
    // Update parent folder checkboxes
    function updateParentFolders(checkbox) {
        const folderPath = checkbox.getAttribute('data-folder');
        if (!folderPath) return;
        
        const pathParts = folderPath.split('/');
        
        // Skip if we're at the root
        if (pathParts.length <= 1) return;
        
        // Remove the last part to get the parent folder path
        pathParts.pop();
        const parentPath = pathParts.join('/');
        
        // Find the parent checkbox
        const parentCheckbox = fileTree.querySelector(`.folder-checkbox[data-folder="${parentPath}"]`);
        if (!parentCheckbox) return;
        
        updateFolderCheckboxState(parentCheckbox, parentPath);
        
        // Recursively update parent folders
        updateParentFolders(parentCheckbox);
    }

    // Update folder checkbox state based on children
    function updateFolderCheckboxState(checkbox, folderPath) {
        // Get all file checkboxes in this folder
        const childFileCheckboxes = fileTree.querySelectorAll(`input[type="checkbox"][data-path^="${folderPath}/"]`);
        
        // Get all folder checkboxes in this folder
        const childFolderCheckboxes = fileTree.querySelectorAll(`.folder-checkbox[data-folder^="${folderPath}/"]`);
        
        let allChecked = true;
        let allUnchecked = true;
        
        // Check file checkboxes
        childFileCheckboxes.forEach(childCheckbox => {
            if (childCheckbox.checked) {
                allUnchecked = false;
            } else {
                allChecked = false;
            }
        });
        
        // Check folder checkboxes
        childFolderCheckboxes.forEach(childCheckbox => {
            if (childCheckbox === checkbox) return; // Skip the current checkbox
            
            if (childCheckbox.checked) {
                allUnchecked = false;
            } else if (childCheckbox.indeterminate) {
                allChecked = false;
                allUnchecked = false;
            } else {
                allChecked = false;
            }
        });
        
        if (allChecked) {
            checkbox.checked = true;
            checkbox.indeterminate = false;
        } else if (allUnchecked) {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        } else {
            checkbox.indeterminate = true;
        }
    }

    // Build tree node recursively
    function buildTreeNode(parentElement, nodeObj, currentPath) {
        const sortedKeys = Object.keys(nodeObj).sort((a, b) => {
            // Skip internal properties like __tokenCount
            if (a === '__tokenCount') return 1;
            if (b === '__tokenCount') return -1;
            if (a === '__selectedTokenCount') return 1;
            if (b === '__selectedTokenCount') return -1;
            
            // Folders first, then files
            const aIsFolder = typeof nodeObj[a] === 'object' && a !== '__tokenCount' && a !== '__selectedTokenCount';
            const bIsFolder = typeof nodeObj[b] === 'object' && b !== '__tokenCount' && b !== '__selectedTokenCount';
            
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            
            // Alphabetical order
            return a.localeCompare(b);
        });
        
        sortedKeys.forEach(key => {
            // Skip internal properties
            if (key === '__tokenCount' || key === '__selectedTokenCount') return;
            
            const li = document.createElement('li');
            const fullPath = currentPath ? `${currentPath}/${key}` : key;
            
            if (typeof nodeObj[key] === 'object' && key !== '__tokenCount' && key !== '__selectedTokenCount') {
                // Folder
                const folderDiv = document.createElement('div');
                folderDiv.className = 'folder';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'folder-checkbox';
                checkbox.checked = true;
                checkbox.setAttribute('data-folder', fullPath);
                
                const folderIcon = document.createElement('span');
                folderIcon.className = 'folder-icon';
                
                const folderName = document.createElement('span');
                folderName.className = 'folder-name';
                folderName.textContent = key;
                
                // Add token count
                const tokenCountSpan = document.createElement('span');
                tokenCountSpan.className = 'token-count';
                const tokenCount = nodeObj[key].__tokenCount || 0;
                const selectedTokenCount = nodeObj[key].__selectedTokenCount || 0;
                const percentage = tokenCount > 0 ? Math.round((selectedTokenCount / tokenCount) * 100) : 0;
                tokenCountSpan.textContent = ` (${selectedTokenCount}/${tokenCount}, ${percentage}%)`;
                folderName.appendChild(tokenCountSpan);
                
                folderDiv.appendChild(checkbox);
                folderDiv.appendChild(folderIcon);
                folderDiv.appendChild(folderName);
                
                // Toggle folder when clicking on folder name or icon
                const toggleFolder = () => {
                    li.classList.toggle('expanded');
                    
                    // Update folder icon class instead of innerHTML
                    if (li.classList.contains('expanded')) {
                        folderIcon.classList.add('open');
                    } else {
                        folderIcon.classList.remove('open');
                    }
                };
                
                folderName.addEventListener('click', toggleFolder);
                folderIcon.addEventListener('click', toggleFolder);
                
                li.appendChild(folderDiv);
                
                // Create child list
                const ul = document.createElement('ul');
                li.appendChild(ul);
                
                // Build children
                buildTreeNode(ul, nodeObj[key], fullPath);
            } else {
                // File - only process if the value is a string (file path)
                if (typeof nodeObj[key] === 'string') {
                    const filePath = nodeObj[key];
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'file';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'file-checkbox';
                    
                    // Find the file object to get its selected state
                    const fileObj = repoFiles.find(f => f.path === filePath);
                    checkbox.checked = fileObj ? fileObj.selected : true;
                    
                    checkbox.setAttribute('data-path', filePath);
                    
                    const fileIcon = document.createElement('span');
                    fileIcon.className = 'file-icon';
                    
                    const fileName = document.createElement('span');
                    fileName.className = 'file-name';
                    fileName.textContent = key;
                    
                    // Add binary file indicator if applicable
                    if (isBinaryFile(filePath)) {
                        const binaryIndicator = document.createElement('span');
                        binaryIndicator.className = 'binary-indicator';
                        binaryIndicator.textContent = '[bin]';
                        binaryIndicator.title = 'Binary file';
                        fileName.appendChild(binaryIndicator);
                    }
                    
                    // Add token count
                    const tokenCountSpan = document.createElement('span');
                    tokenCountSpan.className = 'token-count';
                    const fileObjTokenCount = fileObj?.tokenCount;
                    tokenCountSpan.textContent = fileObjTokenCount !== undefined ? ` (${fileObjTokenCount})` : '';
                    fileName.appendChild(tokenCountSpan);
                    
                    // Add show file button
                    const showFileBtn = document.createElement('button');
                    showFileBtn.className = 'show-file-btn';
                    showFileBtn.textContent = 'Show';
                    showFileBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showFileInEditor(filePath);
                    });
                    
                    fileDiv.appendChild(checkbox);
                    fileDiv.appendChild(fileIcon);
                    fileDiv.appendChild(fileName);
                    fileDiv.appendChild(showFileBtn);
                    
                    li.appendChild(fileDiv);
                }
            }
            
            parentElement.appendChild(li);
        });
    }

    // Initialize Monaco Editor
    function initMonacoEditor() {
        if (monacoEditorLoaded) return Promise.resolve();
        
        return new Promise((resolve) => {
            require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
            require(['vs/editor/editor.main'], function() {
                monacoEditorLoaded = true;
                
                // Set the theme based on current mode
                const isDarkMode = document.documentElement.classList.contains('dark-theme');
                monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');
                
                resolve();
            });
        });
    }
    
    // Show file in Monaco Editor
    function showFileInEditor(filePath) {
        console.log('Opening file in editor:', filePath);
        
        // Find the file object
        const fileObj = repoFiles.find(f => f.path === filePath);
        if (!fileObj) {
            console.error('File not found:', filePath);
            return;
        }
        
        // Set the file name in the modal header
        editorFileName.textContent = filePath;
        
        // Make sure the modal is visible
        editorModal.classList.remove('hidden');
        editorModal.classList.add('show');
        editorModal.style.display = 'flex';
        
        // Wait a bit for the modal to be fully visible
        setTimeout(() => {
            // Initialize Monaco editor
            initMonacoEditor().then(() => {
                console.log('Monaco editor initialized');
                
                // Create editor if it doesn't exist
                if (!monacoEditor) {
                    console.log('Creating new Monaco editor instance');
                    monacoEditor = monaco.editor.create(monacoEditorContainer, {
                        automaticLayout: true,
                        theme: 'vs',
                        scrollBeyondLastLine: false,
                        minimap: { enabled: true },
                        readOnly: true
                    });
                }
                
                // Get language for syntax highlighting
                const language = getLanguageFromExtension(filePath);
                console.log('Language detected:', language);
                
                // Set content and language
                if (monacoEditor.getModel()) {
                    monacoEditor.getModel().setValue(fileObj.content);
                    monaco.editor.setModelLanguage(monacoEditor.getModel(), language);
                } else {
                    const model = monaco.editor.createModel(fileObj.content, language);
                    monacoEditor.setModel(model);
                }
                
                // Force layout update
                setTimeout(() => {
                    if (monacoEditor) {
                        monacoEditor.layout();
                    }
                }, 100);
            }).catch(err => {
                console.error('Error initializing Monaco editor:', err);
            });
        }, 50);
    }
    
    // Close modal
    closeModalBtn.addEventListener('click', () => {
        editorModal.classList.remove('show');
        editorModal.classList.add('hidden');
        editorModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editorModal) {
            editorModal.classList.remove('show');
            editorModal.classList.add('hidden');
            editorModal.style.display = 'none';
        }
    });
    
    // Generate text representation of the repository
    async function generateText() {
        try {
            updateStatus('Generating text representation...', 0);
            
            // Get selected files
            const selectedFiles = repoFiles.filter(file => file.selected);
            
            if (selectedFiles.length === 0) {
                alert('Please select at least one file to include in the text representation.');
                updateStatus('No files selected.', 0);
                return;
            }
            
            // Calculate total token count for selected files
            let totalTokenCount = 0;
            selectedFiles.forEach(file => {
                if (file.tokenCount !== 'N/A') {
                    totalTokenCount += file.tokenCount;
                }
            });
            
            // Update both token estimate displays
            estimatedTokenCount.textContent = `Estimated tokens: ${totalTokenCount}`;
            tokenEstimate.textContent = `Estimated tokens: ${totalTokenCount}`;
            
            // Generate the text representation
            resultText = '';
            
            // Add repository structure outline
            resultText += '# Repository Structure\n\n```\n';
            resultText += generateOutline(repoStructure);
            resultText += '```\n\n';
            
            // Add file contents
            resultText += '# File Contents\n\n';
            
            selectedFiles.forEach(file => {
                resultText += `<code path="${file.path}">\n\n`;
                
                if (isBinaryFile(file.path)) {
                    resultText += '```\n[Binary file not shown]\n```\n\n';
                } else {
                    const language = getLanguageFromExtension(file.path);
                    resultText += '```' + language + '\n';
                    resultText += file.content;
                    resultText += '\n```\n\n';
                }
                resultText += `</code>\n\n`;
            });
            
            // Display the result
            displayResult();
            
            // Show result section
            resultSection.classList.remove('hidden');
            
            updateStatus('Text representation generated successfully!', 100);
            
        } catch (error) {
            console.error('Error generating text:', error);
            updateStatus(`Error generating text: ${error.message}`, 0);
        }
    }
    
    // Generate outline of repository structure
    function generateOutline(structure, prefix = '', isLast = true, parentPrefix = '') {
        let outline = '';
        
        const keys = Object.keys(structure);
        const filteredKeys = [];
        
        // First pass: filter keys to only include selected files and folders with selected content
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = structure[key];
            
            if (typeof value === 'string') {
                // This is a file - check if it's selected
                const fileObj = repoFiles.find(f => f.path === value);
                if (fileObj && fileObj.selected) {
                    filteredKeys.push(key);
                }
            } else {
                // This is a directory - check if it has any selected files
                const hasSelectedContent = hasSelectedFiles(value);
                if (hasSelectedContent) {
                    filteredKeys.push(key);
                }
            }
        }
        
        // Second pass: generate outline with filtered keys
        for (let i = 0; i < filteredKeys.length; i++) {
            const key = filteredKeys[i];
            const value = structure[key];
            const isLastItem = i === filteredKeys.length - 1;
            
            // Current item prefix
            const itemPrefix = isLast ? '└── ' : '├── ';
            // Prefix for children items
            const childPrefix = isLast ? '    ' : '│   ';
            
            if (typeof value === 'string') {
                // This is a file
                outline += parentPrefix + itemPrefix + key + '\n';
            } else {
                // This is a directory
                outline += parentPrefix + itemPrefix + key + '/\n';
                outline += generateOutline(
                    value, 
                    prefix + '  ', 
                    isLastItem,
                    parentPrefix + childPrefix
                );
            }
        }
        
        return outline;
    }
    
    // Helper function to check if a folder has any selected files
    function hasSelectedFiles(folderStructure) {
        for (const key in folderStructure) {
            const value = folderStructure[key];
            
            if (typeof value === 'string') {
                // This is a file - check if it's selected
                const fileObj = repoFiles.find(f => f.path === value);
                if (fileObj && fileObj.selected) {
                    return true;
                }
            } else {
                // This is a directory - check recursively
                if (hasSelectedFiles(value)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Get language for code block based on file extension
    function getLanguageFromExtension(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        
        // Map of file extensions to languages
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'cpp',
            'go': 'go',
            'php': 'php',
            'sh': 'bash',
            'bat': 'batch',
            'ps1': 'powershell',
            'sql': 'sql',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'swift': 'swift',
            'kt': 'kotlin',
            'rs': 'rust',
            'dart': 'dart',
            'lua': 'lua',
            'r': 'r',
            'pl': 'perl',
            'pm': 'perl',
            'scala': 'scala'
        };
        
        return languageMap[extension] || '';
    }
    
    // Get token counting method (tokenizer or length-based)
    function getTokenCountMethod() {
        return typeof GPTTokenizer_cl100k_base !== 'undefined' ? 'tokenizer' : 'length-based';
    }

    // Display the result with syntax highlighting
    function displayResult() {
        // Set the content
        resultDisplay.innerHTML = `<code>${escapeHtml(resultText)}</code>`;
        
        // Estimate tokens
        const tokenCount = estimateTokenCount(resultText);
        const method = getTokenCountMethod();
        tokenEstimate.textContent = `Estimated tokens: ${tokenCount.toLocaleString()} (${method})`;
    }
    
    // Escape HTML special characters
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Estimate token count using gpt-tokenizer or fallback
    function estimateTokenCount(text) {
        try {
            // Try to use gpt-tokenizer if available
            if (typeof GPTTokenizer_cl100k_base !== 'undefined') {
                const { encode } = GPTTokenizer_cl100k_base;
                return encode(text).length;
            } else {
                // Fallback to rough estimation based on string length
                console.error('GPT Tokenizer not available, falling back to string length estimation');
                return Math.ceil(text.length / 4);
            }
        } catch (error) {
            console.error('Error estimating tokens:', error);
            // Fallback to rough estimation
            return Math.ceil(text.length / 4);
        }
    }
    
    // Calculate token count for a single file
    function calculateFileTokenCount(content) {
        if (!content) return 0;
        
        try {
            // Try to use gpt-tokenizer if available
            if (typeof GPTTokenizer_cl100k_base !== 'undefined') {
                const { encode } = GPTTokenizer_cl100k_base;
                return encode(content).length;
            } else {
                // Fallback to rough estimation based on string length
                console.error('GPT Tokenizer not available, falling back to string length estimation');
                return Math.ceil(content.length / 4);
            }
        } catch (error) {
            console.error('Error calculating file token count:', error);
            // Fallback to rough estimation
            return Math.ceil(content.length / 4);
        }
    }
    
    // Copy result to clipboard
    function copyToClipboard() {
        try {
            navigator.clipboard.writeText(resultText).then(() => {
                alert('Text copied to clipboard!');
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = resultText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Text copied to clipboard!');
        }
    }
    
    // Download result as text file
    function downloadAsText() {
        try {
            const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, 'repo-text.txt');
        } catch (error) {
            console.error('Error downloading text:', error);
            alert('Error downloading text: ' + error.message);
        }
    }

    // Toggle all files selection
    function toggleAllFiles(selected) {
        repoFiles.forEach(file => {
            file.selected = selected;
        });
        
        // Update checkboxes in the UI
        const checkboxes = fileTree.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            checkbox.indeterminate = false;
        });
        
        // Update estimated token count
        updateEstimatedTokenCount();
        
        // Update folder selected token counts
        updateFolderSelectedTokenCounts();
    }
    
    // Invert file selection
    function invertSelection() {
        repoFiles.forEach(file => {
            file.selected = !file.selected;
        });
        
        // Update file checkboxes in the UI
        const fileCheckboxes = fileTree.querySelectorAll('input[type="checkbox"][data-path]');
        fileCheckboxes.forEach(checkbox => {
            const filePath = checkbox.getAttribute('data-path');
            const fileObj = repoFiles.find(f => f.path === filePath);
            
            if (fileObj) {
                checkbox.checked = fileObj.selected;
            }
        });
        
        // Update folder checkboxes based on their children
        const folderCheckboxes = fileTree.querySelectorAll('.folder-checkbox');
        folderCheckboxes.forEach(checkbox => {
            const folderPath = checkbox.getAttribute('data-folder');
            updateFolderCheckboxState(checkbox, folderPath);
        });
        
        // Update estimated token count
        updateEstimatedTokenCount();
        
        // Update folder selected token counts
        updateFolderSelectedTokenCounts();
    }
    
    // Update folder checkboxes based on their children's state
    function updateFolderCheckboxes() {
        const folderCheckboxes = fileTree.querySelectorAll('.folder-checkbox');
        
        folderCheckboxes.forEach(checkbox => {
            const folderPath = checkbox.getAttribute('data-folder');
            updateFolderCheckboxState(checkbox, folderPath);
        });
    }

    // Update exclude binary files checkbox state
    function updateExcludeBinaryFiles() {
        const excludeBinaryFiles = excludeBinaryFilesCheckbox.checked;
        
        repoFiles.forEach(file => {
            if (isBinaryFile(file.path)) {
                file.selected = !excludeBinaryFiles;
            }
        });
        
        // Update file checkboxes in the UI
        const fileCheckboxes = fileTree.querySelectorAll('input[type="checkbox"][data-path]');
        fileCheckboxes.forEach(checkbox => {
            const filePath = checkbox.getAttribute('data-path');
            const fileObj = repoFiles.find(f => f.path === filePath);
            
            if (fileObj) {
                checkbox.checked = fileObj.selected;
            }
        });
        
        // Update folder checkboxes based on their children
        const folderCheckboxes = fileTree.querySelectorAll('.folder-checkbox');
        folderCheckboxes.forEach(checkbox => {
            const folderPath = checkbox.getAttribute('data-folder');
            updateFolderCheckboxState(checkbox, folderPath);
        });
        
        // Update estimated token count
        updateEstimatedTokenCount();
        
        // Update folder selected token counts
        updateFolderSelectedTokenCounts();
    }

    // Update estimated token count based on selected files
    function updateEstimatedTokenCount() {
        let totalTokenCount = 0;
        
        // Calculate total token count for selected files
        repoFiles.forEach(file => {
            if (file.selected && file.tokenCount !== 'N/A') {
                totalTokenCount += file.tokenCount;
            }
        });
        
        estimatedTokenCount.textContent = `Estimated token count: ${totalTokenCount}`;
        
        // Update top 10 token used files
        updateTopTokenFiles();
    }
    
    // Update folder selected token counts based on file selection
    function updateFolderSelectedTokenCounts() {
        // Reset all folder selected token counts
        function resetFolderCounts(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && key !== '__tokenCount' && key !== '__selectedTokenCount') {
                    if (obj[key].__selectedTokenCount !== undefined) {
                        obj[key].__selectedTokenCount = 0;
                    }
                    resetFolderCounts(obj[key]);
                }
            }
        }
        
        resetFolderCounts(repoStructure);
        
        // Recalculate selected token counts based on selected files
        repoFiles.forEach(file => {
            if (file.selected && file.tokenCount !== 'N/A') {
                const parts = file.path.split('/');
                let current = repoStructure;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    current = current[part];
                    if (current.__selectedTokenCount !== undefined) {
                        current.__selectedTokenCount += file.tokenCount;
                    }
                }
            }
        });
        
        // Update the displayed counts without re-rendering the entire tree
        updateFolderTokenCountDisplay();
        
        // Update top 10 token used files
        updateTopTokenFiles();
    }
    
    // Update the displayed token counts for all folders
    function updateFolderTokenCountDisplay() {
        const folderElements = document.querySelectorAll('.folder');
        
        folderElements.forEach(folderElement => {
            const folderPath = folderElement.querySelector('.folder-checkbox').getAttribute('data-folder');
            const tokenCountSpan = folderElement.querySelector('.token-count');
            
            if (folderPath && tokenCountSpan) {
                // Navigate to the folder in the structure
                const parts = folderPath.split('/');
                let current = repoStructure;
                
                for (const part of parts) {
                    if (current[part]) {
                        current = current[part];
                    } else {
                        // Folder not found in structure
                        return;
                    }
                }
                
                // Update the token count display
                if (current.__tokenCount !== undefined) {
                    const tokenCount = current.__tokenCount || 0;
                    const selectedTokenCount = current.__selectedTokenCount || 0;
                    const percentage = tokenCount > 0 ? Math.round((selectedTokenCount / tokenCount) * 100) : 0;
                    tokenCountSpan.textContent = ` (${selectedTokenCount}/${tokenCount}, ${percentage}%)`;
                }
            }
        });
    }

    // Update top 10 token used files display
    function updateTopTokenFiles() {
        // Get selected files with token counts
        const selectedFiles = repoFiles.filter(file => 
            file.selected && file.tokenCount !== 'N/A' && file.tokenCount > 0
        );
        
        // Sort by token count (descending)
        selectedFiles.sort((a, b) => b.tokenCount - a.tokenCount);
        
        // Take top 10
        const topFiles = selectedFiles.slice(0, 10);
        
        // Calculate total tokens for percentage
        const totalTokens = selectedFiles.reduce((sum, file) => sum + file.tokenCount, 0);
        
        // Clear current list
        topFilesList.innerHTML = '';
        
        // If no files are selected, show a message
        if (topFiles.length === 0) {
            topFilesList.innerHTML = '<div class="top-file-item">No files selected</div>';
            return;
        }
        
        // Add each file to the list
        topFiles.forEach(file => {
            const percentage = totalTokens > 0 ? ((file.tokenCount / totalTokens) * 100).toFixed(1) : 0;
            
            const fileItem = document.createElement('div');
            fileItem.className = 'top-file-item';
            
            const filePath = document.createElement('div');
            filePath.className = 'top-file-path';
            filePath.textContent = file.path;
            filePath.title = file.path; // For tooltip on hover
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'top-file-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'top-file-progress-bar';
            progressBar.style.width = `${percentage}%`;
            
            const tokenCount = document.createElement('div');
            tokenCount.className = 'top-file-tokens';
            tokenCount.innerHTML = `${file.tokenCount.toLocaleString()} <span class="top-file-percentage">(${percentage}%)</span>`;
            
            // Create deselect button
            const deselectBtn = document.createElement('button');
            deselectBtn.className = 'deselect-file-btn';
            deselectBtn.innerHTML = '&times;'; // × symbol
            deselectBtn.title = 'Deselect this file';
            deselectBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the file item click event from firing
                deselectFile(file.path);
            });
            
            progressContainer.appendChild(progressBar);
            fileItem.appendChild(filePath);
            fileItem.appendChild(progressContainer);
            fileItem.appendChild(tokenCount);
            fileItem.appendChild(deselectBtn);
            
            // Add click event to open the file in the editor
            fileItem.addEventListener('click', () => {
                showFileInEditor(file.path);
            });
            
            topFilesList.appendChild(fileItem);
        });
    }
    
    // Deselect a file by path
    function deselectFile(filePath) {
        // Find the file in repoFiles
        const fileObj = repoFiles.find(f => f.path === filePath);
        
        if (fileObj) {
            // Update the file object
            fileObj.selected = false;
            
            // Update the checkbox in the file tree
            const checkbox = document.querySelector(`input[type="checkbox"][data-path="${filePath}"]`);
            if (checkbox) {
                checkbox.checked = false;
                
                // Update parent folders
                if (checkbox.classList.contains('file-checkbox')) {
                    updateParentFolders(checkbox);
                }
            }
            
            // Update token counts
            updateEstimatedTokenCount();
            updateFolderSelectedTokenCounts();
        }
    }
    
    // Initialize collapsible sections
    function initCollapsibleSections() {
        // Add click event listener to the top files section header
        if (topFilesHeader) {
            topFilesHeader.addEventListener('click', () => {
                topFilesSection.classList.toggle('collapsed');
                
                // Save collapsed state to localStorage
                const isCollapsed = topFilesSection.classList.contains('collapsed');
                localStorage.setItem('topFilesCollapsed', isCollapsed);
            });
            
            // Restore collapsed state from localStorage
            const isCollapsed = localStorage.getItem('topFilesCollapsed') === 'true';
            if (isCollapsed) {
                topFilesSection.classList.add('collapsed');
            }
        }
    }

    // Initialize
    function init() {
        initTheme();
        // Hide sections initially
        statusSection.classList.add('hidden');
        fileTreeSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        
        // Initialize collapsible sections
        initCollapsibleSections();
    }

    // Update status display
    function updateStatus(message, progress) {
        statusMessage.textContent = message;
        
        if (progress >= 0) {
            progressBar.style.width = `${progress}%`;
            progressInfo.textContent = `${progress}%`;
        }
    }

    // Call init
    init();
});
