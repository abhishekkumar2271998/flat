# stenoai reviewer notes

## Architecture
The `stenoai` codebase is a macOS application designed to be a privacy-focused audio recording and transcription tool powered by AI. It consists of two main components: a Python backend located in `src/` for audio handling and processing, and an Electron-based frontend in the `app/` directory built with React and Vite for the user interface. The architecture supports local model execution for transcription and summarization, ensuring sensitive data remains on-device.

## Conventions
- **Directory Structure**: The codebase is organized into `src/`, which contains Python files for backend logic, and `app/`, housing the Electron app and frontend code (React). The `simple_recorder.py` file serves as the CLI interface. Static assets can be found under `website/`.
- **Python Code Style**: Adhere strictly to PEP 8 guidelines. Type hints and docstrings are used extensively to enhance code readability and maintainability. Linting is performed with `ruff` as noted in `CONTRIBUTING.md`.
- **JavaScript Standards**: Use semicolons and prefer `const` or `let` over `var`. File organization in `app/` follows a pattern where components, hooks, and utility files are placed within `renderer/src/` based on their functions. 
- **TypeScript Configuration**: A strict TypeScript configuration is maintained in `app/renderer/tsconfig.json`, enforcing checks such as no unused locals or parameters and strict null checks.
- **Tailwind CSS**: The project utilizes Tailwind CSS for styling, configured in `app/renderer/tailwind.config.cjs`. It follows a structured theme setup, allowing for a consistent styling approach across components.

## Intentional non-standard choices
- **Electron `initMain` Call**: The initialization of `electron-audio-loopback` with `forceCoreAudioTap: true` in `main.js` suggests prioritizing a specific macOS audio recording implementation, which may lead to confusion if a developer expects the standard behavior of Electron's IPC pattern.
- **Manual Semantic Versioning**: The project employs a non-standard versioning process as indicated in the `CONTRIBUTING.md`. Maintainers manually push version updates, and developers must remember to handle version bumps carefully during PR reviews.

## Watch out for
- **Uncaught Promises**: Ensure that all asynchronous calls, particularly in the `main.js` file, have appropriate error handling to prevent unhandled promise rejections.
- **IPC Security**: The `preload.js` exposes only a controlled interface for the renderer. Review any new IPC channels added for security risks (e.g., unauthorized access to sensitive functions).
- **Performance Bottlenecks**: The reliance on synchronous calls and processes (like `exec` and blocking file reads in `main.js`) might create performance limitations, especially under load. Look for opportunities to switch to asynchronous handling where feasible.
- **Resource Management**: Make sure to test the impact of background processes such as audio capture on system performance and memory usage, especially when multiple instances are running simultaneously.

Given these conventions and points to watch, the review process can be streamlined by adhering to the established practices and actively testing areas that could lead to performance and security issues.