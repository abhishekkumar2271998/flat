# flat reviewer notes

## Architecture
The `flat` codebase is structured as a cross-platform application that utilizes Python for the backend functionality, specifically for audio recording and processing, while the frontend is built as an Electron app utilizing React and Vite. It separates concerns into distinct directories: `src` for the Python backend and `app` for the Electron app, ensuring clear boundaries between the two layers.

## Conventions
- **Code Style**:
  - **Python**: Strict adherence to PEP 8 with type hints and docstrings used for documentation (`src/audio_recorder.py` shows adherence, e.g., function type hints).
  - **JavaScript/TypeScript**: Use semicolons and `const`/`let` instead of `var`, as specified in the `CONTRIBUTING.md`.
- **File Structure**: The project follows a clear directory structure:
  - `app/`: contains the Electron app code, including `renderer` for React components.
  - `src/`: includes Python scripts for backend processing like `audio_recorder.py` and `transcriber.py`.

- **TypeScript Configuration**: The `tsconfig.json` enforces strict type checking and includes paths for better imports. The use of module resolution and the exclusion of emitting output is configured for a streamlined development experience.
- **Tailwind CSS Usage**: Tailwind is integrated into the React app, utilizing custom configurations defined in `tailwind.config.cjs`, including theme extensions and animation settings.

## Intentional non-standard choices
- **Dependency Management**: The `Makefile` for the microphone monitor (`mic-monitor/Makefile`) compiles Swift code into a binary, which may seem unconventional in a typical JavaScript/Python setup. However, this is intended for future platform compatibility (i.e., potential Windows support).
  
- **Preload Bridge**: In `app/preload.js`, the context bridge is being used to control how the renderer communicates with the main process, ensuring strict boundaries as per Electron best practices, even though it may add complexity. This is an intentional choice to enhance security.

## Watch out for
- **Linting/Formatting Issues**: Ensure that `ruff` (for Python) and `eslint` (for JavaScript) are run as part of the local development workflow; missing this may lead to inconsistencies in code quality.
  
- **Dependency Management**: Be cautious about dependency versions in `requirements.txt` and `package.json`; keep them updated to avoid security vulnerabilities.

- **Type Safety**: Pay close attention to type safety in TypeScript files, ensuring strict checks are adequately handled to prevent runtime errors.

- **Component Structure**: With React components, ensure that functional components are used consistently and unnecessary class components are avoided (`app/renderer/src/App.tsx` illustrates using functional hooks).

- **Error Handling**: When working with asynchronous calls (e.g., in `app/main.js` for IPC), ensure proper error handling and logging to aid in debugging and user notifications.