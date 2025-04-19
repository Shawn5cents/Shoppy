# Shoppy - Shopping List PWA

A simple, offline-first Progressive Web App for managing shopping lists with store locator and reminders.

## Features

- 📝 Shopping list management (add, complete, delete items)
- 📋 Multiple shopping lists
- 🏪 Store locator using OpenStreetMap
- 🔔 Time and location-based reminders
- 📱 Installable as a PWA
- 🔄 Works offline
- 🌙 Dark mode

## Tech Stack

- **Frontend**: React (via Vite)
- **Storage**: IndexedDB (local device storage only)
- **Maps**: Leaflet with OpenStreetMap
- **PWA**: Vite PWA Plugin
- **Notifications**: Browser Notifications API

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shoppy
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## PWA Features

- **Offline Support**: The app works without an internet connection
- **Installable**: Can be added to your home screen
- **Responsive**: Works on all device sizes
- **Push Notifications**: For reminders (requires permission)

## Privacy

This app stores all data locally on your device. No data is sent to any server.

## License

MIT