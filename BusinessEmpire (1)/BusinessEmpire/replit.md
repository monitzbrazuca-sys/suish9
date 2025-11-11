# Meu Império de Negócios

## Overview

Meu Império de Negócios is a comprehensive business management platform for tracking multiple revenue streams including PLR Nacional (Brazilian digital products), PLR Internacional (international digital products), and Marca de Roupas (clothing brand). The application provides product management, sales tracking, financial analytics, and reporting capabilities with a premium dashboard interface featuring gold and black Material Design aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and bundler.

**Routing**: Wouter library for lightweight, hook-based client-side routing with protected route patterns.

**State Management**: TanStack Query (React Query) for server state management with optimistic updates and cache invalidation. No global state management library - leveraging React Query's built-in caching and the React Context API for authentication state.

**UI Component Library**: shadcn/ui components based on Radix UI primitives with Tailwind CSS styling. Custom design system with gold (#FFD700) primary color, black (#0A0A0A) dark elements, and neutral grays for hierarchy.

**Form Handling**: React Hook Form with Zod schema validation for type-safe form management and data validation.

**Data Visualization**: Recharts library for rendering line charts (daily profit trends), bar charts (category comparisons), and other financial visualizations.

**Styling Approach**: Tailwind CSS utility classes with custom CSS variables for theming. Design system follows Material Design principles adapted for business dashboards with emphasis on data clarity and professional aesthetics.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Design**: RESTful API architecture with resource-based endpoints (`/api/plr-nacional/products`, `/api/sales`, etc.). Authentication middleware protects all business logic routes.

**Authentication Strategy**: Passport.js with dual authentication support:
- Local Strategy: Username/password authentication with scrypt hashing for password storage
- Replit Auth (OpenID Connect): OAuth integration for Replit platform authentication
- Express sessions with persistent storage for maintaining user state

**Session Management**: Express-session with PostgreSQL-backed session store using connect-pg-simple for production persistence.

**Request Processing**: JSON body parsing with raw body preservation for webhook scenarios. Request/response logging middleware for API debugging and monitoring.

### Data Storage

**Primary Database**: PostgreSQL via Neon serverless with WebSocket support for edge deployment compatibility.

**ORM**: Drizzle ORM for type-safe database queries and schema migrations. Schema-first approach with automatic TypeScript type generation from database schema.

**Database Schema**:
- `users`: User accounts with authentication credentials and profile data
- `sessions`: Express session persistence (required for authentication)
- `plr_nacional_products`: Brazilian PLR products with acquisition costs and sale prices in BRL
- `plr_internacional_products`: International PLR products with USD costs and exchange rate tracking
- `clothing_products`: Clothing inventory with production costs, stock quantities, and sales
- `sales`: Transaction records with category tags, profit calculations, and timestamps

**Storage Layer Abstraction**: IStorage interface pattern allowing swappable implementations (in-memory for development, PostgreSQL for production). Currently using in-memory storage as the default implementation.

**Migration Strategy**: Drizzle Kit for generating and running database migrations with `db:push` script for schema synchronization.

### Authentication & Authorization

**Authentication Flow**: 
- Session-based authentication with HTTP-only cookies
- User identity stored in session and serialized/deserialized via Passport
- `isAuthenticated` middleware guards all business routes
- Password hashing uses scrypt with per-user salt generation

**User Model**: Supports username/password credentials plus optional OAuth fields (email, firstName, lastName, profileImageUrl) for Replit Auth integration.

**Session Security**: 
- 7-day session expiration
- HTTP-only cookies preventing XSS attacks
- SameSite cookie policy for CSRF protection
- Trust proxy configuration for deployment behind reverse proxies

### External Dependencies

**Database**: 
- Neon PostgreSQL (serverless PostgreSQL provider)
- Connection via `@neondatabase/serverless` with WebSocket support

**UI Component Dependencies**:
- Radix UI primitives (20+ component packages for accessible UI elements)
- Tailwind CSS for utility-first styling
- Lucide React for icon system

**Build & Development Tools**:
- Vite with React plugin for fast development and optimized production builds
- TypeScript compiler for type checking
- esbuild for server-side bundling in production
- Replit-specific plugins for development environment integration

**Authentication Services**:
- Passport.js with Local and OpenID Client strategies
- Replit OIDC provider integration (optional)

**Data Validation**:
- Zod for runtime type validation and schema definitions
- Drizzle-Zod for generating Zod schemas from database schema

**Charting & Visualization**:
- Recharts for React-based chart components

**Utilities**:
- date-fns for date formatting and manipulation
- nanoid for unique ID generation
- memoizee for function result caching