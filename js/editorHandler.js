/**
 * Monaco Editor functionality for the code2prompt application
 */

import { getLanguageFromExtension } from './utils.js';

// Variables
let monacoEditor = null;
let monacoEditorLoaded = false;

// Initialize Monaco Editor
export function initMonacoEditor() {
    if (monacoEditorLoaded) return;
    
    console.log('Initializing Monaco Editor');
    
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        monacoEditorLoaded = true;
        console.log('Monaco Editor loaded');
        
        // Check if dark mode is enabled
        const isDarkMode = document.documentElement.classList.contains('dark-theme');
        
        // Create editor with appropriate theme
        monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            theme: isDarkMode ? 'vs-dark' : 'vs',
            automaticLayout: true,
            readOnly: true,
            minimap: { enabled: true }
        });
        
        // Make the editor available globally
        window.monacoEditor = monacoEditor;
    });
}

// Show file in Monaco Editor
export function showFileInEditor(filePath) {
    console.log('Showing file in editor:', filePath);
    
    const editorModal = document.getElementById('editor-modal');
    const editorFileName = document.getElementById('editor-file-name');
    
    // Find file in repoFiles
    let fileContent = '';
    let fileLanguage = 'plaintext';
    
    for (const file of window.repoFiles) {
        if (file.path === filePath) {
            fileContent = file.content;
            fileLanguage = getLanguageFromExtension(filePath);
            console.log('Found file content, language:', fileLanguage);
            break;
        }
    }
    
    // Initialize Monaco Editor if not already loaded
    if (!monacoEditorLoaded) {
        console.log('Monaco Editor not loaded, initializing...');
        initMonacoEditor();
        
        // Wait for editor to load
        const checkEditorLoaded = setInterval(() => {
            if (monacoEditorLoaded && monacoEditor) {
                clearInterval(checkEditorLoaded);
                setEditorContent(filePath, fileContent, fileLanguage);
                showModal(editorModal, editorFileName, filePath);
            }
        }, 100);
    } else {
        setEditorContent(filePath, fileContent, fileLanguage);
        showModal(editorModal, editorFileName, filePath);
    }
}

// Set editor content
function setEditorContent(filePath, fileContent, fileLanguage) {
    console.log('Setting editor content for:', filePath);
    
    // Set model language
    const model = monacoEditor.getModel();
    if (model) {
        monaco.editor.setModelLanguage(model, fileLanguage);
    }
    
    // Set content
    monacoEditor.setValue(fileContent);
}

// Show modal
function showModal(editorModal, editorFileName, filePath) {
    console.log('Showing modal for:', filePath);
    
    // Set file name
    editorFileName.textContent = filePath;
    
    // Show modal
    editorModal.classList.remove('hidden');
    editorModal.classList.add('show');
    
    // Resize editor
    if (monacoEditor) {
        monacoEditor.layout();
    }
}

// Initialize close modal button
export function initCloseModalButton() {
    const closeModalBtn = document.querySelector('.close-modal');
    const editorModal = document.getElementById('editor-modal');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            editorModal.classList.remove('show');
            editorModal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === editorModal) {
            editorModal.classList.remove('show');
            editorModal.classList.add('hidden');
        }
    });
}
