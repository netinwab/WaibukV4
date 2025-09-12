# Overview

This is a full-stack educational yearbook application called "Waibuk" built with React, Express.js, and PostgreSQL. The application provides three distinct user interfaces with role-based access control:

1. **Student Dashboard** - Students can view their profile, classmates, and school memories across different academic years
2. **Viewer Dashboard** - External viewers (like parents/alumni) can browse school yearbooks and memories from different schools and years  
3. **School Administrator Dashboard** - Complete management system for schools to manage students, academic years, upload photos, and create viewer accounts
4. **Super Admin Dashboard** - Hidden administrative interface for managing all accounts and approving schools

The system is designed to showcase student memories and school events through an interactive web interface with e-commerce capabilities including payment processing and revenue sharing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and hot module replacement
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system including CSS variables for theming and dark mode support
- **Routing**: Wouter for lightweight client-side routing with dynamic route parameters
- **State Management**: TanStack Query (React Query) for server state management, caching, and optimistic updates
- **Form Handling**: React Hook Form with Zod validation schemas for type-safe form validation
- **Theme System**: Custom theme provider with localStorage persistence and system preference detection

## Backend Architecture
- **Framework**: Express.js with TypeScript for type safety and modern JavaScript features
- **API Design**: RESTful endpoints organized by feature (auth, users, schools, memories, cart, payments)
- **Middleware**: Custom authentication middleware, file upload handling with Multer, and request/response logging
- **Security**: Secure image serving with user authentication, blocked direct file access, and role-based permissions
- **Development**: Vite integration for hot reloading during development with custom error overlay

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and migrations
- **Connection**: Neon serverless PostgreSQL for cloud deployment with HTTP connections
- **Schema Management**: Drizzle Kit for version-controlled database migrations and schema synchronization
- **Fallback Strategy**: Memory storage class for development/testing scenarios when database is unavailable

## Authentication & Authorization
- **Authentication Method**: Simple username/password with Bearer token authorization using user IDs
- **User Types**: Four distinct roles - students, viewers, school administrators, and super admins
- **Session Management**: Client-side localStorage for user session persistence across browser sessions
- **Access Control**: Route-level protection and API endpoint authorization based on user roles
- **Super Admin**: Hidden administrative access via special routes and elevated permissions

## File Management & Security
- **Upload Handling**: Multer middleware for handling file uploads with size limits and type validation
- **Secure Image Serving**: Custom secure image endpoints that require user authentication
- **File Organization**: Structured upload directories by type (profiles, memories, yearbooks, accreditation)
- **Access Control**: Blocked direct file access with secure API endpoints for authorized image retrieval

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with HTTP connection support
- **Drizzle ORM**: Type-safe database client with migration support

## Payment Processing
- **Paystack**: Payment gateway for processing transactions with revenue sharing capabilities
- **Revenue Sharing**: Automatic subaccount creation for schools with configurable percentage splits

## Email Services
- **SendGrid**: Email delivery service for notifications and communication

## File Storage & Uploads
- **Multer**: Middleware for handling multipart/form-data file uploads
- **Local File System**: Server-side file storage with organized directory structure

## UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library with consistent styling

## Development Tools
- **Vite**: Fast build tool with hot module replacement and development server
- **Replit Integration**: Development environment support with runtime error overlay
- **TypeScript**: Type safety across frontend and backend with shared schema definitions

## Currency & Localization
- **Exchange Rate API**: Real-time USD to NGN conversion using Fawaz Exchange API
- **Multi-currency Support**: Dynamic pricing display based on user preferences

# Recent Changes

**September 12, 2025:**
- **5-Step School Signup Wizard Implementation**: Completely redesigned school registration process into an intuitive multi-step wizard
  - **Step 1: School Information** - School name, founding year, website (optional)
  - **Step 2: Location Details** - Country, state/province, city, address (optional)
  - **Step 3: Contact Information** - School email, phone number
  - **Step 4: Verification Information** - Registration number, accreditation document upload (optional)
  - **Step 5: Account Setup** - Administrator username, password, password confirmation
  - Added comprehensive step-by-step validation with clear error messages
  - Implemented progress indicators showing completion status for each step
  - Enhanced user experience with smooth navigation between steps
  - Maintained all existing functionality while improving usability

- **Database Schema Enhancement**: Added phone number and website fields to schools table
  - Added phoneNumber field as required for school contact information
  - Added website field as optional for schools to provide their web presence
  - Updated database schema and pushed changes successfully

- **Backend API Updates**: Modified school registration endpoint to handle new fields
  - Updated server routes to accept and validate phone number and website data
  - Enhanced form data processing to include all new multi-step form fields
  - Maintained backward compatibility with existing approval workflow

- **Super Admin Dashboard Enhancement**: Added phone number display to school management interface
  - Added "Phone Number" column to schools table in super admin dashboard
  - Updated table headers and data display to show school phone numbers
  - Enhanced school information visibility for administrators

- **Previous Changes:**
  - **Responsive Design Implementation**: Added fully responsive design to both viewer-settings and school-settings pages
    - Mobile-first responsive design with proper breakpoints (mobile: < 640px, tablet: 640-1024px, desktop: > 1024px)
    - Implemented collapsible sidebar navigation for mobile devices with smooth slide-in animation  
    - Added mobile sidebar overlay with backdrop for better UX
    - Touch-friendly buttons and inputs optimized for mobile interaction
    - Responsive form layouts that adapt perfectly to all screen sizes
    - Enhanced header responsiveness with proper spacing and text truncation
    - Maintained account status indicators and cart access for viewer settings across all screen sizes
  - **Navigation Improvements**: Updated both dashboard types to route to their respective settings pages instead of generic settings