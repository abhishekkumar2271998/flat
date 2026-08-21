# flat reviewer notes

## Architecture
This codebase implements a desktop application named Steno, which functions as an AI-powered stenographer for recording, transcribing, and summarizing meetings. The project is structured into two main areas: a Python backend located in `src/` (handling audio recording, transcription, and data management) and an Electron-based frontend in `app/` (serving as the desktop interface with React and TypeScript).

## Conventions
- **Branching and Commits**: Features are developed in branches named `feature/your-feature-name`. All commits should have clear, descriptive messages as specified in `CONTRIBUTING.md`.
- **Python Coding Style**: Python code should follow PEP 8 guidelines, utilize type hints, and include docstrings. It's enforced using `ruff` for linting (`requirements.txt`).
- **JavaScript Coding Style**: Use semicolons, and prefer `const` and `let` over `var`, following existing patterns. ESLint rules apply as outlined in `app/package.json`.
- **Folder Structure**: The repository follows a well-defined directory structure; `src/` contains all Python code related to backend functionalities, while `app/` contains the Electron app, components, and associated scripts.
- **Environment Variables**: Configuration settings are loaded from a `.env` file at runtime, as seen in `app/main.js`, ensuring sensitive information does not appear in source control.

## Intentional non-standard choices
- **Dependency Management**: The choice of using `npm` scripts in `app/package.json` for multiple tasks (such as building, linting, and testing) may seem lengthy but is intentional to streamline various development workflows in the Electron app context.
- **Single Instance Lock**: The app uses Electron's `requestSingleInstanceLock` to prevent multiple instances from running simultaneously. Any code indicating a possible violation (e.g., `app.requestSingleInstanceLock()`) should not be flagged, as it helps manage user experience effectively.

## Watch out for
- **Environment Hardcoding**: Ensure environment-specific configurations do not leak into source control or production (e.g., secrets in `.env`).
- **Window Handling**: Check for potential edge cases when creating the Electron window in `app/main.js`, especially when handling state changes during navigation.
- **Component Re-rendering**: In `app/renderer/src/App.tsx`, verify that state changes related to recording or session handling do not cause unnecessary re-renders that could degrade performance.
- **Type Safety**: Be vigilant for inconsistencies in TypeScript types, especially when working with states or props in React components, to avoid runtime errors.

By following these guidelines, you can effectively review contributions to the StenoAI codebase while honoring established patterns and evolving the application responsibly.