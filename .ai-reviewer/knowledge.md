# StenoAI reviewer notes

## Architecture
StenoAI is an Electron-based application designed to serve as a private AI-powered stenographer, facilitating audio recording, transcription, and summarization of meetings. The codebase is organized into a frontend (React+Vite) residing in the `app` directory, and a Python backend for audio processing and handling AI tasks located in the `src` directory. Configuration files and scripts for building, testing, and dependency management are also included at the project root.

## Conventions
- **Python Code Style**: Follow PEP 8 guidelines, implement type hints, and use docstrings for functions/classes. For example, `src/audio_recorder.py` adheres to these standards.
- **JavaScript/TypeScript**: Use semicolons and prefer `const`/`let` over `var`. In the React components (like `app/renderer/src/App.tsx`), patterns from existing files should be followed for consistency.
- **Directory Structure**:
  - `app/` - Contains the Electron application and its build configurations.
  - `src/` - Contains Python code for backend processes.
  - `simple_recorder.py` - Acts as a command-line interface for the backend functionality.
- **Tailwind CSS Configuration**: Use utility classes as defined in `app/renderer/tailwind.config.cjs`, extending the theme and managing layouts centrally.
- **Versioning**: Follow manual semantic versioning as outlined in `CONTRIBUTING.md`, with maintainer oversight for release and version management.

## Intentional non-standard choices
- **Python Utilization**: The Python backend uses dynamic type checking with `pydantic` and relies on defined models in `models.py`. This contrasts with conventional static type enforcement methods, possibly affecting maintainability.
- **Environment Variable Management**: The application loads environment variables from a `.env` file with a custom parser in `app/main.js`, which is less common than using established libraries like `dotenv`. This approach might obfuscate configuration management.

## Watch out for
- **Anti-patterns in Use**: Ensure RxJS-style subscriptions in React components are properly cleaned up to avoid memory leaks. Example: in `App.tsx`, the `ipc()` event subscriptions should correctly handle potential memory management issues.
- **File Structure Consistency**: Maintain an organized approach when adding new components or services in `app/renderer/src`, as misplacing files can lead to confusion in the routing and import logic.
- **Type Safety in TypeScript**: While strict type checking is enabled via TypeScript settings, watch for inconsistencies or untyped variables which could lead to runtime errors, especially in `renderer/src` files.

By adhering to these conventions and being vigilant of specific patterns, contributors can maintain the integrity and maintainability of the StenoAI codebase.