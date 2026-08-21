# StenoAI reviewer notes

## Architecture
StenoAI is an Electron application that serves as a local AI-powered transcription and meeting notes tool. The codebase is organized into two main directories: `src` for the Python backend handling audio recording, transcription, and summarization, and `app` for the Electron-based frontend built with React and Vite.

## Conventions
- **Python Style**: PEP 8 guidelines are strictly followed, with a focus on type hints and consistent docstrings. `simple_recorder.py` provides a consistent CLI interface for users.
- **JavaScript/TypeScript**: JavaScript uses `const` and `let` instead of `var`, while `package.json` scripts are used for handling tasks such as linting (`lint:renderer` script) and building (`build` script). 
- **File Structure**: The `app` directory distinguishes between the main process (`main.js`), preload scripts (`preload.js`), and components/routes (`renderer/src`) for readability.
- **Versioning**: Manual semantic versioning is used, with changes logged in a structured manner, as indicated in `README.md` under "What's New".
- **Environment Configuration**: Uses a `.env` file to handle sensitive configuration values and maintains security and flexibility when deploying (discussed in `main.js`).

## Intentional non-standard choices
- The application uses `ruff` for linting in Python instead of a more common tool like `flake8` or `pylint`. Although it may seem unusual, the team has standardized on `ruff` for Python linting tasks.
- The use of `npm scripts` as a primary way to handle build, development, and testing workflows in JavaScript might slightly differ from other standards where task runners like Gulp or Grunt could be expected.

## Watch out for
- **Inconsistent Import Paths**: Although the TypeScript configuration includes aliasing (as seen in `tsconfig.json`), inconsistent import paths across files (relative vs absolute) can lead to confusion and errors.
- **Error Handling**: Ensure that all asynchronous operations in both the backend (Python) and frontend (JavaScript) properly handle errors to avoid silent failures, especially in the Electron context where user feedback is vital.
- **Limited Test Coverage**: Check for unit tests, particularly for critical functions in Python and React. The use of `playwright` suggests end-to-end testing; however, there may be gaps in covering the application’s logic in isolation.
- **Resource Management**: In `main.js`, ensure that system resources (like audio capture) are correctly managed and released to prevent memory leaks, particularly in heavy-use cases where recordings are frequent.