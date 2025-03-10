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

## Technologies Used

- Pure HTML, CSS, and JavaScript (no build steps)
- [JSZip](https://stuk.github.io/jszip/) for handling ZIP files
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for downloading text files
- [tiktoken](https://github.com/openai/tiktoken) for token counting

## Deployment

This application can be hosted on GitHub Pages or any static web hosting service without any build steps.

## License

MIT
