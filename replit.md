# Overview

This is a full-stack educational yearbook application built with React, Express.js, and PostgreSQL. The application provides three distinct user interfaces:

1. **Student Dashboard** - Students can view their profile, classmates, and school memories across different academic years
2. **Viewer Dashboard** - External viewers (like parents/alumni) can browse school yearbooks and memories from different schools and years  
3. **School Administrator Dashboard** - Complete management system for schools to manage students, academic years, upload photos, and create viewer accounts

The system is designed to showcase student memories and school events through an interactive web interface with role-based access control.

## Recent Changes (2026)
- **Year Filtering**: Updated year management to only show years from school founding year to current year (2026)
- **Purchase Dependencies**: Implemented viewer purchase restrictions - viewers can only buy years that schools have already purchased
- **Library Functionality**: Fixed viewer library feature to properly display purchased yearbooks organized by school
- **Alumni Tab Implementation**: Added Alumni tab for verified alumni users with classmate discovery functionality
- **Student Management**: Added Student schema and API endpoints for alumni networking features
- **Copy/Download Features**: Enhanced school registration with copy and download buttons for school codes
- **Date Validation**: Fixed date of birth validation to prevent future dates in signup forms

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a custom design system including CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **API Design**: RESTful endpoints for authentication, users, schools, students, achievements, and memories
- **Development Server**: Custom Vite integration for hot reloading during development
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Logging**: Custom request/response logging for API endpoints

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for cloud deployment
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **In-Memory Storage**: Fallback MemStorage class for development/testing scenarios

## Authentication & Authorization
- **Simple Authentication**: Username/password authentication with user type differentiation
- **User Types**: Three distinct user roles - students, viewers, and school administrators
- **Session Management**: Client-side localStorage for user session persistence
- **Route Protection**: Client-side route guards based on authentication status

## Data Models
- **Users**: Core user entity with authentication and profile information (student/viewer/school admin roles)
- **Schools**: School entities with basic information and student counts
- **Students**: Links users to schools with academic details
- **Memories**: School-wide photo memories with event details and dates organized by academic year
- **Academic Years**: Time-based organization of school data with purchase/activation system
- **Alumni Badges**: Special status markers for verified alumni with graduation information

# External Dependencies

## UI and Design
- **Radix UI**: Comprehensive component primitives for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variant management

## Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

## Database and Backend
- **Drizzle ORM**: Type-safe database operations and migrations
- **Neon Database**: Serverless PostgreSQL hosting
- **Express.js**: Node.js web application framework
- **Connect PG Simple**: PostgreSQL session store

## Frontend State and Forms
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form validation and handling
- **Zod**: Schema validation for forms and API data
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **CLSX & Tailwind Merge**: Conditional CSS class management
- **Nanoid**: Unique ID generation
- **Embla Carousel**: Carousel/slider components