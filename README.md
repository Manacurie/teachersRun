# WebSocket Canvas Game

A real-time multiplayer canvas-based game built with WebSocket technology. Players can connect simultaneously and interact in a shared game environment with live synchronization.

## Features

- Real-time multiplayer gameplay
- WebSocket-based communication
- Canvas-based graphics rendering
- Player movement and interaction
- Live player synchronization
- Audio feedback system
- Responsive game design

## Technology Stack

### Frontend
- HTML5 Canvas
- JavaScript (ES6+)
- WebSocket Client
- Audio API

### Backend
- Node.js
- Express.js
- WebSocket Server (ws)
- HTTP Server

## Project Structure

```
WebsocketCanvas/
├── public/
│   ├── index.html
│   ├── images/
│   │   ├── background.png
│   │   ├── hills.png
│   │   ├── platform.png
│   │   └── platformSmallTall.png
│   ├── scripts/
│   │   ├── code.js
│   │   └── player.js
│   ├── sounds/
│   │   └── winSound.mp3
│   └── styles/
│       └── styles.css
├── server.js
├── package.json
└── README.md
```

## Local Development Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Manacurie/Case9_WebsocketCanvas.git
cd WebsocketCanvas
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npx nodemon server.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Local Development Configuration

For local development, you may need to update the WebSocket connection in `public/scripts/code.js`:

```javascript
// For local development, change backendHost to:
const backendHost = "localhost:3000";
```

## Production Deployment

This project is designed to be deployed using a split architecture:

### Frontend Deployment (Netlify)
1. Deploy the `public/` folder to Netlify
2. Netlify will serve the static files (HTML, CSS, JS, images, sounds)

### Backend Deployment (OnRender)
1. Deploy the entire repository to OnRender
2. OnRender will run the `server.js` WebSocket server
3. Configure the production URL in `public/scripts/code.js`

### Environment Configuration

The application is currently configured for production with:
- Frontend: Netlify hosting
- Backend: OnRender WebSocket server at `teachersrun.onrender.com`

## Dependencies

### Runtime Dependencies
- **express**: ^5.2.1 - Web framework for Node.js
- **ws**: ^8.19.0 - WebSocket library for Node.js
- **websocket**: ^1.0.35 - Additional WebSocket utilities

### Development Dependencies
- **nodemon**: ^3.1.11 - Development server with auto-reload

## Game Controls

- Use keyboard inputs to control player movement
- Multiple players can connect and play simultaneously
- Game state is synchronized across all connected clients

## WebSocket Communication

The game uses WebSocket connections for real-time communication:

### Client to Server Messages
- Player join events
- Movement updates
- Game interactions

### Server to Client Messages
- Welcome messages with player ID
- Player movement synchronization
- Player disconnect notifications
- Game state updates

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the backend server is running
   - Check that the WebSocket URL is correct
   - Verify HTTPS/WSS protocol usage for production

2. **Assets Not Loading**
   - Confirm all image and sound files are in the `public/` directory
   - Check file paths in the JavaScript code
   - Verify server is serving static files correctly

3. **Multiple Players Not Syncing**
   - Check WebSocket connection status
   - Monitor server logs for connection issues
   - Ensure message parsing is working correctly

### Development Tips

- Use browser Developer Tools to monitor WebSocket connections
- Check the Network tab for WebSocket messages
- Monitor server logs for client connections and disconnections
- Use `console.log()` for debugging game state

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details

## Repository

GitHub: https://github.com/Manacurie/Case9_WebsocketCanvas