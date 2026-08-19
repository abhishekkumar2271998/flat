# StenoAI reviewer notes

## Architecture
The StenoAI codebase is designed to be an Electron-based desktop application that facilitates audio recording, transcription, and summarization functionalities, specifically tailored for macOS users. The project is organized into two main folders: `src/` for the Python backend which handles audio recording and processing, and `app/` for the Electron frontend utilizing React and Vite.

## Conventions
- **File Structure**: The source code adheres to a clear structure; `src/` contains Python modules for audio functionalities (e.g., `audio_recorder.py`, `transcriber.py`), while `app/` contains all frontend code including the Electron main process (`main.js`) and React components under `renderer/src/`.
- **JavaScript Coding Style**: In JavaScript files, semicolons are mandatory at the end of every statement, and `const` or `let` is preferred over `var` for variable declarations, as enforced by the ESLint configuration.
- **Python Coding Style**: Python follows PEP 8 guidelines, with an emphasis on type hints in function definitions and docstrings for all modules (e.g., `simple_recorder.py`).
- **Version Control**: Semantic versioning is employed manually, as detailed in `CONTRIBUTING.md`, where maintainers manage version bumps while contributors focus on code quality without handling versioning.
- **Dependency Management**: All Python dependencies are listed in `requirements.txt`, and JavaScript dependencies are managed through `package.json`, including devDependencies for tools like ESLint and Prettier for code quality.

## Intentional non-standard choices
- **Electron Context Bridging**: The usage of `contextBridge` in `preload.js` intentionally abstracts IPC functionality, ensuring that renderer code remains unaware of Electron APIs. This design choice enhances security by limiting direct access to Node.js features.

## Watch out for
- **Mixing Python and JavaScript Code**: Ensure that the Python backend and the Electron frontend communicate seamlessly via IPC channels, and avoid hardcoding paths that might fail in production environments (as observed in `main.js`).
- **Memory Management and Performance Issues**: Given the app’s reliance on audio processing, be vigilant about potential memory leaks, especially when dealing with recording sessions or large data buffers.
- **Error Handling**: Ensure robust error logging and handling mechanisms in functions that involve external processes (e.g., audio recording) to prevent crashes that could disrupt user experience.
- **Unit and Integration Testing**: As highlighted in `CONTRIBUTING.md`, test every change locally before submitting a PR. Ensure to include unit tests, particularly for functionalities within `src/` that could be prone to edge cases, like transcript generation and audio processing.