# DISCLAIMER: this was made with ai so i have no idea what some of the files deep in the folders even are

# GLauncher 3.0 - Ultimate HTML5 Game Launcher

I Perfected it this will probably be my last version of Glauncher thx for everything

GLauncher is an advanced web-based platform for seamless game file management, upload, and interactive gameplay. Built with modern web technologies and optimized for both development and production environments.

## 🚀 Quick Start with GitHub Codespaces

1. **Open in Codespaces**: Click the green "Code" button → "Codespaces" → "Create codespace on main"
2. **Automatic Setup**: Codespaces will automatically install dependencies and start the development server on port 8000
3. **Access Application**: Once started, your browser will automatically open GLauncher

### Manual Codespaces Setup
```bash
# Install dependencies
npm install

# Start development server for Codespaces (port 8000)
npm run dev:codespaces

# Or use the standard dev command (port 5000)
npm run dev
```

## 🎮 Features

### Core Functionality
- **File Upload**: Drag-and-drop HTML and ZIP file support
- **Game Playing**: Advanced iframe-based game player with fullscreen support
- **Real-time Monitoring**: Play time tracking, FPS counter, and performance metrics
- **Library Management**: Organize, search, and filter your games
- **Statistics**: Detailed gameplay statistics and session tracking

### Advanced Features
- **Download Monitoring**: Automatically detect and handle downloads from games
- **External Link Handling**: Open external links in new browser tabs
- **Screenshot Capture**: Take screenshots of gameplay
- **Screen Recording**: Record gameplay sessions (simulated)
- **Volume Control**: Advanced audio controls for games
- **Screen Modes**: Switch between desktop and mobile viewing modes
- **Theme System**: Multiple built-in themes with custom theme creator

### Performance Features
- **CodePen Optimized**: Special optimized version for CodePen environment
- **Mobile Responsive**: Works on all device sizes
- **Hardware Acceleration**: GPU-accelerated animations and transitions
- **Memory Management**: Efficient resource usage and cleanup

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **TailwindCSS** with shadcn/ui components
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Lucide React** for modern icons

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Multer** for file upload handling
- **Real-time WebSocket** support

### Development Tools
- **GitHub Codespaces** ready
- **Replit** compatible
- **Docker** support (via devcontainer)
- **GitHub Actions** for CI/CD

## 🚀 Deployment Options

### 1. GitHub Codespaces (Recommended for Development)
- One-click development environment
- Pre-configured with all dependencies
- Automatic port forwarding
- VS Code extensions included

### 2. Local Development
```bash
git clone https://github.com/yourusername/glauncher.git
cd glauncher
npm install
npm run dev
```

### 3. Production Deployment
```bash
npm run build
npm start
```

### 4. GitHub Pages
- Automatic deployment via GitHub Actions
- Static file hosting
- Custom domain support

## 📱 Usage

### Uploading Games
1. Drag and drop HTML or ZIP files into the upload zone
2. Files are processed and validated automatically
3. Games appear in your library ready to play

### Playing Games
1. Click any game from your library
2. Game loads in an advanced iframe player
3. Use fullscreen mode for immersive gameplay
4. Access advanced controls for screenshots, recording, and more

### Advanced Features
- **Download Monitoring**: Games that try to download files will show download options
- **External Links**: Links to external sites open in new tabs automatically
- **Performance Monitoring**: Real-time FPS and resource usage tracking
- **Theme Customization**: Create and share custom themes

## 🎨 Customization

### Themes
- 8 built-in themes (Purple, Blue, Green, Red, Orange, Cyberpunk, Retro, Classic)
- Custom theme creator with HSL color picker
- Community theme sharing
- Real-time preview

### Settings
- FPS counter toggle
- Auto-save preferences
- Hardware acceleration controls
- Notification settings
- Volume and audio controls

## 🔧 Configuration

### Environment Variables
```bash
PORT=8000                    # Server port (8000 for Codespaces, 5000 for Replit)
NODE_ENV=development         # Environment mode
DATABASE_URL=your_db_url     # PostgreSQL connection string
```

### Codespaces Configuration
The `.devcontainer/devcontainer.json` includes:
- Node.js 20 runtime
- Automatic dependency installation
- Port forwarding (8000, 5000)
- VS Code extensions for web development
- Auto-start development server

## 🚀 Performance Optimizations

### CodePen Version
- Reduced DOM complexity
- Optimized animations
- Mobile detection
- Debounced updates
- Memory management

### General Optimizations
- Lazy loading
- Image compression
- Bundle splitting
- Tree shaking
- Gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Open in GitHub Codespaces for instant development environment
4. Make your changes
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Feature requests and general discussion
- **Documentation**: Check the wiki for detailed guides

## 🎯 Roadmap

- [ ] WebRTC multiplayer support
- [ ] Cloud save synchronization
- [ ] Advanced game analytics
- [ ] Plugin system for extensions
- [ ] Mobile app version
- [ ] VR/AR game support

---

Built with ❤️ for the gaming community. Enjoy your games! 🎮
