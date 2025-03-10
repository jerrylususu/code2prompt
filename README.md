# code2prompt

A web application that creates a text representation of a Git repository for use with Large Language Models (LLMs). This tool allows you to convert a GitHub repository into a structured text format that can be easily pasted into an LLM.

## ⚠️ Caution

**Important**: This repository itself was built by an LLM and should not be used in production environments without thorough review and testing. LLM-generated code may contain:
- Security vulnerabilities
- Logical errors
- Outdated practices
- Incomplete implementations

Always review, test, and validate any LLM-generated code before using it in a production environment.

## Features

- **Multiple Input Methods**: Paste a GitHub URL or upload a repository ZIP file
- **File Selection**: Include or exclude specific files from the output
- **Binary File Handling**: Automatically excludes common binary files (images, videos, executables, etc.)
- **Token Estimation**: View an estimate of the token count for the generated text
- **Status Display**: Real-time feedback on download progress, extraction, and processing
- **No Build Steps**: Works directly in the browser with no build process required

## How to Use

1. **Input a Repository**:
   <!-- - Enter a GitHub repository URL (e.g., `https://github.com/username/repo`) and click "Download" -->
   - OR upload a ZIP file of a Git repository

2. **Select Files**:
   - Use the file tree to select which files to include in the output
   - Use the "Select All", "Deselect All", or "Invert Selection" buttons to quickly manage selections
   - Binary files (images, videos, etc.) are excluded by default, but you can toggle this behavior

3. **Generate Text**:
   - Click "Generate Text" to create the text representation
   - View the estimated token count for the generated text

4. **Use the Result**:
   - Copy the text to clipboard
   - Download as a text file
   - Paste into your favorite LLM

## Output Format

The generated text follows this format:

```
<repo_structure>
folder/
  file.js
  subfolder/
    another-file.js
</repo_structure>

<file path="folder/file.js">
```javascript
// File content here
```
</file>

<file path="folder/subfolder/another-file.js">
```javascript
// File content here
```
</file>
```

## How It Works

The application follows these steps to convert a Git repository into a text representation:

1. **Repository Input Processing**:
   - When a ZIP file is uploaded, it's processed using JSZip to extract all files and their contents
   - Files are organized into a hierarchical structure that mirrors the repository's organization

2. **File Analysis and Filtering**:
   - Binary files (images, videos, executables, etc.) are automatically detected based on file extensions
   - Hidden files and directories (starting with `.` or containing `/.`) are identified
   - Users can customize which files to include/exclude using the file tree interface

3. **Tree Visualization**:
   - The repository structure is rendered as an interactive tree view
   - Folders can be expanded/collapsed for easier navigation
   - File selection is managed with checkboxes, with options to select all, deselect all, or invert selection
   - Token counts are estimated and displayed for each folder and file

4. **Text Generation**:
   - The application generates a structured text representation with two main sections:
     - Repository structure outline (folder hierarchy)
     - File contents with appropriate code syntax markers
   - Each file is wrapped in `<file path="...">` tags with language-specific code blocks
   - Syntax highlighting is applied to the preview for better readability

5. **Token Estimation**:
   - The application uses TikToken to estimate token counts for each file and the entire output
   - This helps users gauge whether the output will fit within their LLM's context window
   - Token counts are displayed at both the folder level and for the entire selection

6. **File Preview**:
   - Files can be previewed in a Monaco Editor modal before including them in the output
   - This allows users to verify file contents and decide whether to include specific files

7. **Output Handling**:
   - The generated text can be copied to clipboard or downloaded as a text file
   - The output is ready to be pasted directly into an LLM without further formatting

The application runs entirely in the browser with no server-side processing, ensuring privacy and eliminating the need for build steps or deployment complexity.

## Technologies Used

- Pure HTML, CSS, and JavaScript (no build steps)
- [JSZip](https://stuk.github.io/jszip/) for handling ZIP files
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for downloading text files
- [tiktoken](https://github.com/openai/tiktoken) for token counting

## Deployment

This application can be hosted on GitHub Pages or any static web hosting service without any build steps.

## License

MIT
