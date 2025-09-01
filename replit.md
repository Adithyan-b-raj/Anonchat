# Overview

This is a real-time chat application built with a modern full-stack architecture. The application provides a WebSocket-based messaging system with typing indicators, user presence tracking, and a responsive UI. Users can join the chat with auto-generated anonymous usernames and see who's online in real-time.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks for local state, TanStack React Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js for the HTTP server
- **WebSocket**: Native WebSocket implementation for real-time messaging
- **Data Storage**: In-memory storage with interfaces designed for easy database migration
- **Schema Validation**: Zod for runtime type checking and validation
- **Development**: Hot reload with Vite integration in development mode

## Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe queries
- **Schema**: Centralized schema definitions in the `shared` directory
- **Migrations**: Drizzle Kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL driver

## Real-time Communication
- **Protocol**: WebSocket connections on `/ws` path to avoid conflicts with Vite HMR
- **Features**: 
  - Real-time messaging with message history
  - Typing indicators with automatic cleanup
  - User presence tracking and online count
  - Connection status monitoring
- **Message Types**: Support for both user messages and system notifications

## Development Workflow
- **Monorepo Structure**: Organized into `client`, `server`, and `shared` directories
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Hot Reload**: Vite middleware integration for seamless development experience
- **Build Process**: Separate build steps for client (Vite) and server (esbuild)

## UI/UX Design
- **Design System**: Shadcn/ui with "new-york" style variant
- **Theme**: Dark theme with CSS custom properties for consistent theming
- **Responsive**: Mobile-first design with responsive breakpoints
- **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for Node.js
- **ws**: WebSocket library for real-time communication

## Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management
- **zod**: Schema validation library

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration and introspection tool
- **esbuild**: Fast JavaScript bundler for server builds

## Database Service
- **Neon Database**: Serverless PostgreSQL hosting platform
- **Connection**: Via DATABASE_URL environment variable
- **Features**: Automatic scaling and connection pooling