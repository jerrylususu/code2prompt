/**
 * UI helper functions for the code2prompt application
 */

// Update status display
export function updateStatus(message, progress) {
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const progressInfo = document.getElementById('progress-info');
    
    if (statusMessage) {
        statusMessage.textContent = message;
    }
    
    if (progressBar && progressInfo) {
        progressBar.style.width = `${progress}%`;
        progressInfo.textContent = `${Math.round(progress)}%`;
    }
}

// Initialize collapsible sections
export function initCollapsibleSections() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    for (const header of collapsibleHeaders) {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            content.classList.toggle('collapsed');
            
            // Update collapse icon
            const collapseIcon = this.querySelector('.collapse-icon');
            if (collapseIcon) {
                collapseIcon.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    }
}
