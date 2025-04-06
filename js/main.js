/**
 * Main entry point for the code2prompt application
 */

import { initTheme } from './theme.js';
import { handleGithubDownload } from './githubHandler.js';
import { handleZipUpload, repoFiles, loadProjectAsExample } from './zipHandler.js';
import { toggleAllFiles, invertSelection } from './fileTree.js';
import { generateText, copyToClipboard, downloadAsText, displayResult } from './textGenerator.js';
import { initMonacoEditor, initCloseModalButton, showFileInEditor } from './editorHandler.js';
import { initCollapsibleSections } from './uiHelpers.js';

// Initialize global variables
window.repoFiles = repoFiles;
window.repoStructure = {};
window.resultText = '';
window.monacoEditor = null;
window.showFileInEditor = showFileInEditor;
window.displayResult = displayResult;
window.selectionChanged = false; // Track if file selection has changed

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing application');
    
    // Initialize application
    init();
});

// Initialize application
function init() {
    // Initialize theme
    initTheme();
    
    // Initialize collapsible sections
    initCollapsibleSections();
    
    // Initialize GPT tokenizer
    initGptTokenizer();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize Monaco Editor
    initMonacoEditor();
    
    // Initialize close modal button
    initCloseModalButton();
    
    console.log('Application initialized');
}

// Initialize GPT tokenizer
function initGptTokenizer() {
    try {
        // Check if GPTTokenizer_cl100k_base (GPT-3.5/4 tokenizer) is available
        if (window.GPTTokenizer_cl100k_base && typeof window.GPTTokenizer_cl100k_base.encode === 'function') {
            console.log('GPT tokenizer (GPTTokenizer_cl100k_base) initialized successfully');
            // Store a reference to the encode function for easier access
            window.gptTokenizerEncode = window.GPTTokenizer_cl100k_base.encode;
            // Set tokenizer status
            window.tokenizerAvailable = true;
        } else {
            console.warn('GPT tokenizer (GPTTokenizer_cl100k_base) not found, will use fallback for token counting');
            // Set tokenizer status
            window.tokenizerAvailable = false;
            // Show warning in UI
            displayTokenizerWarning();
        }
    } catch (error) {
        console.error('Error initializing GPT tokenizer:', error);
        // Set tokenizer status
        window.tokenizerAvailable = false;
        // Show warning in UI
        displayTokenizerWarning();
    }
}

// Display tokenizer warning in the status section
function displayTokenizerWarning() {
    // Show the status section if it's hidden
    const statusSection = document.getElementById('status-section');
    if (statusSection) {
        statusSection.classList.remove('hidden');
    }
    
    // Update the status message with a warning
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.innerHTML = '<strong>⚠️ Warning:</strong> GPT tokenizer not available. Token counts may be inaccurate. Please check your connection or try refreshing the page.';
        statusMessage.style.color = '#ff9800'; // Warning color
    }
}

// Initialize event listeners
function initEventListeners() {
    // DOM Elements
    const downloadBtn = document.getElementById('download-btn');
    const zipUploadInput = document.getElementById('zip-upload');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const invertSelectionBtn = document.getElementById('invert-selection-btn');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const loadExampleBtn = document.getElementById('load-example-btn');
    
    console.log('Setting up event listeners');
    
    // GitHub download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleGithubDownload);
    }
    
    // ZIP upload input
    if (zipUploadInput) {
        console.log('Setting up ZIP upload input event listener');
        zipUploadInput.addEventListener('change', handleZipUpload);
    } else {
        console.error('ZIP upload input element not found');
    }
    
    // Load example button
    if (loadExampleBtn) {
        console.log('Setting up Load Example button event listener');
        loadExampleBtn.addEventListener('click', loadProjectAsExample);
    } else {
        console.error('Load Example button element not found');
    }
    
    // Select all button
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => toggleAllFiles(true));
    }
    
    // Deselect all button
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => toggleAllFiles(false));
    }
    
    // Invert selection button
    if (invertSelectionBtn) {
        invertSelectionBtn.addEventListener('click', invertSelection);
    }
    
    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener('click', generateText);
    }
    
    // Copy button
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    // Download text button
    if (downloadTextBtn) {
        downloadTextBtn.addEventListener('click', downloadAsText);
    }
    
    console.log('Event listeners set up');
}
