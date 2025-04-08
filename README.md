# ChatGPT Voice Assistant

A cross-platform desktop application that integrates speech recognition with ChatGPT. This application allows you to speak and automatically opens ChatGPT with your transcribed text.

## Features

- Real-time speech recognition
- Cross-platform support (Windows and macOS)
- Modern and responsive UI
- Automatic ChatGPT integration

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will start the application in development mode with hot reloading.

## Building

To build the application for your platform:

```bash
npm run build
npm run package
```

This will create platform-specific installers in the `dist` folder.

## Usage

1. Launch the application
2. Click the "Start Listening" button to begin speech recognition
3. Speak clearly into your microphone
4. The application will transcribe your speech in real-time
5. When you finish speaking, it will automatically open ChatGPT with your transcribed text

## Notes

- Make sure your microphone is properly connected and has necessary permissions
- The application requires an internet connection for speech recognition and ChatGPT access
- Currently, the application opens ChatGPT in your default browser 