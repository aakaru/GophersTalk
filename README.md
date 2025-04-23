# Gophers Talk

A real-time chat application with a stunning UI, built with React, Framer Motion, and Tailwind CSS, connecting to a Go WebSocket backend.

## Features

- Real-time WebSocket communication
- Modern dark theme with glassmorphism effects
- Smooth animations using Framer Motion
- Mobile-first responsive design
- Username display and online users list
- Message history with timestamps
- Connection status indicators

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Go backend server running on `ws://localhost:8080/ws`

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and visit `http://localhost:3000?username=yourname`

## Usage

- You must add your username as a URL parameter: `?username=yourname`
- Type your message in the input field and press Enter or click the Send button
- View online users by clicking the users button in the header
- Connection status is shown next to your username

## Backend API

The app connects to a Go WebSocket server at `ws://localhost:8080/ws?username=xyz`

The expected message format is:

```json
{
  "username": "string",
  "text": "string",
  "timestamp": number,
  "type": "message" | "system"
}
```

System messages (user join/leave) are also displayed in the chat interface.

## Design

- Built according to PRD.md and UI_GUIDELINES.md specifications
- Uses dark theme with a transparent green-yellow Python-style gradient
- Glass-like panels with backdrop blur
- Neon accents and smooth animations
