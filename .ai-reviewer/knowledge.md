# stenoai reviewer notes

## Architecture
This codebase is an Electron application designed for audio recording, transcription, and summarization tailored for confidential conversations. It is organized into two primary directories: `src/`, which contains the Python backend handling audio processing and model integration, and `app/`, which houses the Electron frontend, including React and Vite configuration. A CLI interface is also provided through `simple_recorder.py`.

## Conventions
- **Python Style**: Follow PEP 8 guidelines, and utilize type hints in all function definitions to enhance code readability. Docstrings are mandatory for all functions and classes.
- **JavaScript Style**: Use semicolons, prefer `const` and `let` over `var`, and adhere to existing patterns in the codebase. Ensure proper use of React and TypeScript in the front-end components.
- **Testing and Linting**: The repository mandates the use of `ruff` for Python linting and `eslint` along with `prettier` for JavaScript/TypeScript, ensuring a consistent code style across both languages.
- **Feature Branching**: New features should be developed on a feature branch named in the format `feature/your-feature-name` following the project's Git workflow as outlined in `CONTRIBUTING.md`.
- **Directory Structure**: Maintain a clean structure, following the pattern shown:
  - `src/` for Python backend code (e.g., `audio_recorder.py`, `transcriber.py`).
  - `app/` for Electron app files (e.g., `main.js`, `renderer/`).
  
## Intentional non-standard choices
- The project uses manual semantic versioning, which deviates from automated versioning approaches. Maintainers manage version increments using Git commands, while contributors focus solely on coding. Additionally, the decision to rely on TypeScript's newer features, such as `ESNext` modules in `tsconfig.json`, might create issues when using older environments.
- `mic-monitor` is built using Swift and designed for macOS compatibility only. Its existence is crucial for future Windows porting, which may seem superfluous at the moment.

## Watch out for
- Ensure all external dependencies are up-to-date as specified in `requirements.txt` for Python and `package.json` for JavaScript. The use of fixed-version dependencies can lead to issues with updates.
- Be careful with the management of the Electron app state related to IPC (Inter-Process Communication). The clear separation of concerns between the main and renderer processes must be maintained as defined in `ipc-contract.md` to avoid unintended behavior.
- Pay special attention to error handling, particularly within async functions in `main.js`, to avoid runtime issues with unhandled promise rejections, especially during status checks and API calls.
- Avoid relying on implicit behavior from systems like macOS due to differing versions (e.g., CoreAudio support). Always check and document compatibility constraints and how features behave across different macOS versions.