# Employee Tracker - Source Code Structure

This document outlines the organized structure of the Employee Tracker application source code.

## 📁 Directory Structure

### `/api` - API Layer
- **`/clients`** - HTTP client configurations and base API setup
- **`/services`** - Service classes for different business domains
  - `attendance.service.ts` - Attendance management APIs
  - `break.service.ts` - Break tracking APIs
  - `employee.service.ts` - Employee management APIs
  - `flowace.service.ts` - Flowace integration APIs
  - `assignment.service.ts` - Work assignment APIs
  - `issue.service.ts` - Issue tracking APIs
  - `warning.service.ts` - Warning management APIs
  - `tag.service.ts` - Tag management APIs
  - `log.service.ts` - Work log APIs

### `/app` - Next.js App Router
- **`/admin`** - Admin portal pages and layouts
- **`/employee`** - Employee portal pages and layouts
- **`/api`** - Next.js API routes organized by feature

### `/components` - Reusable UI Components
- **`/ui`** - Basic UI components (buttons, cards, forms, etc.)
- **`/auth`** - Authentication-related components
- **`/admin`** - Admin-specific components
- **`/employee`** - Employee-specific components
- **`/attendance`** - Attendance-related components
- **`/flowace`** - Flowace-related components
- **`/layout`** - Layout components

### `/config` - Configuration Files
- `api.ts` - API endpoints and configuration
- `database.ts` - Database configuration
- `index.ts` - Configuration exports

### `/constants` - Application Constants
- `app.ts` - Application-wide constants and enums

### `/contexts` - React Context Providers
- `AdminAuthContext.tsx` - Admin authentication context
- `EmployeeAuthContext.tsx` - Employee authentication context
- `SupabaseAuthContext.tsx` - Supabase authentication context

### `/hooks` - Custom React Hooks
- Data fetching hooks
- Authentication hooks
- Form handling hooks
- Mobile detection hooks

### `/lib` - Library Utilities
- **`/api`** - API utility functions
- `prisma.ts` - Database ORM setup
- `supabase.ts` - Supabase client setup
- `utils.ts` - General utility functions
- `validations.ts` - Form validation schemas

### `/providers` - React Providers
- `QueryProvider.tsx` - React Query provider setup

### `/types` - TypeScript Type Definitions
- `index.ts` - Main type exports
- `common.ts` - Common/shared types
- `employee.ts` - Employee-related types
- `attendance.ts` - Attendance-related types
- `flowace.ts` - Flowace-related types

### `/utils` - Utility Functions
- `formatters.ts` - Data formatting utilities
- `validators.ts` - Data validation utilities
- `attendanceValidation.ts` - Attendance-specific validations
- `csvParsers.ts` - CSV parsing utilities
- `flowaceUtils.ts` - Flowace-specific utilities
- `logger.ts` - Logging utilities

## 🎯 Key Features by Domain

### Authentication & Authorization
- **Admin Auth**: Code-based authentication for administrators
- **Employee Auth**: Employee code-based authentication
- **Unified Auth**: Combined authentication system
- **Route Guards**: Protected routes for both admin and employee areas

### Employee Management
- Employee CRUD operations
- Employee code generation
- Department and position management
- Employee status tracking

### Attendance Management
- Real-time attendance tracking
- CSV import/export functionality
- Calendar view for attendance records
- Attendance summary and analytics
- Multiple status types (Present, Absent, Late, Half Day, etc.)

### Break Tracking
- Real-time break monitoring
- Break duration warnings
- Break history and analytics
- Automatic break validation

### Work Log Management
- Task-based work logging
- Assignment management
- Work hour calculations
- Performance metrics

### Flowace Integration
- Activity tracking and monitoring
- Productivity analytics
- Time tracking integration
- CSV upload for Flowace data

### Issue Management
- Employee issue reporting
- Issue status tracking
- Admin response system
- Issue categorization

### Asset Management
- Asset inventory tracking
- Asset assignment to employees
- Maintenance logging
- Asset condition monitoring

## 🛠 Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **UI Components**: Custom component library built on Radix UI
- **Authentication**: Context-based authentication system

### Backend
- **API**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **File Handling**: CSV parsing and file uploads
- **Integration**: Supabase for additional services

### Data Flow
1. **Client** → React components with hooks
2. **Hooks** → API service classes
3. **Services** → HTTP client
4. **API Routes** → Business logic
5. **Prisma** → Database operations

## 📝 Development Guidelines

### Code Organization
- Keep components focused and single-purpose
- Use TypeScript interfaces for all data structures
- Organize imports by external → internal → relative
- Use barrel exports (index.ts) for clean imports

### Naming Conventions
- **Files**: kebab-case for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase

### Best Practices
- Always use TypeScript types
- Implement proper error handling
- Use React Query for data fetching
- Keep API responses consistent
- Validate all user inputs
- Use constants for magic numbers/strings

## 🔧 Configuration

### Environment Variables
- Database connection strings
- API keys and secrets
- Feature flags
- Upload directories

### Build Configuration
- TypeScript configuration
- ESLint rules
- Prettier formatting
- Build optimization settings

This structure ensures maintainability, scalability, and clear separation of concerns throughout the application.