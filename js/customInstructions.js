/**
 * Custom instructions functionality for the code2prompt application
 * Handles saving/loading custom instructions to/from localStorage
 */

const CUSTOM_INSTRUCTION_KEY = 'code2prompt_custom_instruction';

// Initialize custom instructions functionality
export function initCustomInstructions() {
    console.log('Initializing custom instructions');
    
    // Load custom instruction from localStorage
    loadCustomInstruction();
    
    // Set up event listeners
    setupCustomInstructionEventListeners();
    
    console.log('Custom instructions initialized');
}

// Set up event listeners for custom instruction functionality
function setupCustomInstructionEventListeners() {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    const editCustomInstructionBtn = document.getElementById('edit-custom-instruction-btn');
    
    if (customInstructionTextarea) {
        // Save to localStorage when user types (with debounce)
        let saveTimeout;
        customInstructionTextarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCustomInstruction();
            }, 500); // Wait 500ms after user stops typing
        });
        
        // Also save when losing focus
        customInstructionTextarea.addEventListener('blur', saveCustomInstruction);
    }
    
    if (editCustomInstructionBtn) {
        editCustomInstructionBtn.addEventListener('click', () => {
            // Scroll to custom instruction section and focus
            const customInstructionSection = document.querySelector('.custom-instruction-section');
            const topTokenFilesSection = document.getElementById('top-token-files-section');
            
            if (topTokenFilesSection) {
                topTokenFilesSection.classList.remove('hidden');
                
                if (customInstructionSection) {
                    customInstructionSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // Focus the textarea after scrolling
                    setTimeout(() => {
                        if (customInstructionTextarea) {
                            customInstructionTextarea.focus();
                        }
                    }, 500);
                }
            }
        });
    }
}

// Save custom instruction to localStorage
function saveCustomInstruction() {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    
    if (customInstructionTextarea) {
        const instruction = customInstructionTextarea.value;
        try {
            localStorage.setItem(CUSTOM_INSTRUCTION_KEY, instruction);
            console.log('Custom instruction saved to localStorage');
        } catch (error) {
            console.error('Error saving custom instruction to localStorage:', error);
        }
    }
}

// Load custom instruction from localStorage
function loadCustomInstruction() {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    
    if (customInstructionTextarea) {
        try {
            const savedInstruction = localStorage.getItem(CUSTOM_INSTRUCTION_KEY);
            if (savedInstruction) {
                customInstructionTextarea.value = savedInstruction;
                console.log('Custom instruction loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading custom instruction from localStorage:', error);
        }
    }
}

// Get current custom instruction text
export function getCustomInstruction() {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    
    if (customInstructionTextarea) {
        return customInstructionTextarea.value.trim();
    }
    
    return '';
}

// Set custom instruction text (useful for programmatic updates)
export function setCustomInstruction(instruction) {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    
    if (customInstructionTextarea) {
        customInstructionTextarea.value = instruction;
        saveCustomInstruction();
    }
}

// Update the custom instruction preview in the result section
export function updateCustomInstructionPreview() {
    const customInstruction = getCustomInstruction();
    const previewContainer = document.querySelector('.custom-instruction-preview');
    const previewText = document.getElementById('custom-instruction-preview-text');
    
    if (previewContainer && previewText) {
        if (customInstruction) {
            previewContainer.classList.remove('hidden');
            previewText.textContent = customInstruction;
        } else {
            previewContainer.classList.add('hidden');
        }
    }
}

// Clear custom instruction
export function clearCustomInstruction() {
    const customInstructionTextarea = document.getElementById('custom-instruction');
    
    if (customInstructionTextarea) {
        customInstructionTextarea.value = '';
        saveCustomInstruction();
        updateCustomInstructionPreview();
    }
} 