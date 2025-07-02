# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "OAG Data Portal" - a Next.js application for the Office of the Attorney General's data management system. It's a secure government portal focused on marriage registration records with role-based access control, department management, and comprehensive audit logging.

## Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Setup
Requires `.env.local` with Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

### Technology Stack
- **Frontend**: Next.js 13.5.1 with TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **State Management**: React Context (AuthProvider)
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation

### Database Schema
Key tables in Supabase:
- `user_profiles` - User information with admin/approval flags
- `departments` - Government departments
- `user_departments` - Many-to-many user-department relationships
- `marriages` - Marriage registration records with file attachments
- `audit_logs` - Complete activity tracking for compliance

### Authentication & Authorization
- Supabase Auth with email/password
- Role-based access: admin vs regular users
- Approval workflow: new users require admin approval
- Department-based data access control

### Key Components Architecture
- **Auth System**: `/lib/auth.ts` handles all authentication logic
- **Supabase Client**: `/lib/supabase.ts` with typed database schema
- **Auth Provider**: `/components/providers/auth-provider.tsx` manages global auth state
- **UI Components**: `/components/ui/` contains reusable shadcn/ui components
- **Feature Components**: Organized by domain (auth, dashboard, marriages, etc.)

### Routing Structure
- `/` - Landing page with auto-redirect for approved users
- `/auth` - Login/registration forms
- `/dashboard` - Main dashboard with statistics
- `/marriages` - Marriage records CRUD interface
- `/admin/` - Admin-only pages for user/department management

### File Upload System
Marriage records support file attachments stored in Supabase Storage with metadata in the `files` JSONB column.

### Security Features
- Row Level Security (RLS) policies in Supabase
- Department-based data isolation
- Comprehensive audit logging for all data modifications
- Admin approval required for new user access