# GLauncher - HTML5 Game Launcher

## Overview

GLauncher is a full-stack web application that allows users to upload, manage, and play HTML-based game clients (particularly Eaglercraft clients) directly in their browser. The application features file upload capabilities, game client detection, community theme sharing, and an embedded game player with iframe support.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TailwindCSS** with shadcn/ui components for styling
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Custom theme system** with support for multiple color schemes and community-shared themes

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design for file management and theme sharing
- **File upload handling** with Multer middleware
- **Database integration** using Drizzle ORM
- **PostgreSQL** as the primary database (via Neon)

### Key Components

#### File Management System
- Supports HTML, ZIP, JAR, JSON, and EXE file uploads (up to 80MB)
- Automatic client detection for Eaglercraft versions
- ZIP file extraction and analysis for packaged games
- File validation and security checks
- Metadata extraction including client version, Minecraft version, and compatibility warnings

#### Game Player
- Iframe-based game embedding with full-screen support
- Enhanced controls with refresh, settings, and fullscreen toggles
- Real-time FPS monitoring and play time tracking
- Auto-hide controls for immersive gameplay
- Cross-browser compatibility for fullscreen API

#### Theme System
- Built-in themes (dark, blue, purple, green, red, orange, cyberpunk, retro)
- Custom theme creator with HSL color picker
- Community theme sharing and rating system
- Real-time theme preview
- Theme import/export functionality

## Data Flow

### File Upload Flow
1. User selects or drops files into upload zone
2. Client-side validation (file type, size limits)
3. FormData sent to `/api/files/upload` endpoint
4. Server processes file with Multer middleware
5. File validation and client detection on server
6. ZIP extraction if applicable
7. File metadata stored in PostgreSQL database
8. Response with file information sent to client
9. Client updates file list via React Query

### Game Playing Flow
1. User selects game from file list
2. Game player component renders with selected file
3. Iframe loads game content from `/api/files/:id/content`
4. Enhanced controls provide game management features
5. Play statistics tracked and stored locally

### Theme Management Flow
1. User customizes theme in settings panel
2. Theme data stored in local storage and applied via CSS variables
3. Optional sharing to community gallery via `/api/themes`
4. Community themes browsable and downloadable by other users

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **multer**: File upload middleware
- **yauzl**: ZIP file processing
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date formatting utilities

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution for server
- **esbuild**: Production bundling

## Deployment Strategy

### Replit Configuration
- **Node.js 20** runtime environment
- **PostgreSQL 16** database module
- **Auto-scaling** deployment target
- **Port 5000** for local development, port 80 for production

### Build Process
1. Development: `npm run dev` runs server with hot reload
2. Production build: `npm run build` creates optimized client bundle and server bundle
3. Production start: `npm run start` runs compiled server

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment setting (development/production)

## Recent Updates (August 13, 2025)

### Advanced Features Added
- **Enhanced Iframe Monitoring**: Automatic detection and handling of downloads from games running in iframe
- **External Link Management**: Smart handling of external links opening in new browser tabs instead of within iframe
- **Advanced Game Analytics Panel**: Real-time performance monitoring with AI-powered insights, FPS tracking, memory usage, and exportable analytics
- **Live Streaming & Recording Panel**: Screen capture, live streaming simulation, recording controls, and stream sharing capabilities
- **GitHub Codespaces Support**: Complete configuration for one-click development environment setup on port 8000
- **Screenshot & Recording**: Advanced screenshot capture and gameplay recording functionality
- **Advanced Controls**: Volume control, screen mode switching (desktop/mobile), and enhanced iframe controls

### Deployment Infrastructure
- **GitHub Codespaces**: Pre-configured devcontainer with Node.js 20, automatic port forwarding, and VS Code extensions
- **GitHub Actions**: Automated CI/CD pipeline for deployment to GitHub Pages
- **Multi-Environment Support**: Configurable for both Replit (port 5000) and Codespaces (port 8000) environments
- **CodePen Optimized**: Ultimate standalone HTML version with all advanced features for CodePen deployment

### Technical Enhancements
- **Advanced Iframe Communication**: Cross-origin content monitoring and interaction
- **Performance Monitoring**: Real-time FPS counting, memory usage tracking, and session analytics
- **Mobile Responsive**: Fully optimized for all screen sizes with adaptive layouts
- **Theme System**: Enhanced with community sharing and real-time preview capabilities

## Changelog
- August 13, 2025: Added advanced iframe capabilities, GitHub Codespaces support, analytics panel, streaming panel, and deployment infrastructure
- June 27, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.