# OAG Data Portal

A secure, modern web application for the Office of the Attorney General's data management system. Built for cross-departmental collaboration, comprehensive audit trails, and regulatory compliance.

## 🏛️ Overview

The OAG Data Portal streamlines operations across Office of the Attorney General departments with secure, centralized data management. Starting with marriage registration records, this system is designed to expand across all OAG departmental data needs.

## ✨ Key Features

### 🔐 Security & Compliance
- **Government-grade security** with role-based access controls
- **Complete audit trail** - track who changed what, when, and why
- **Department-based data isolation** with secure boundaries
- **Admin approval workflow** for new users

### 🔍 Advanced Search & Data Management
- **Progressive search** - type "4" → "48" → "488" → "48849" for instant results
- **Field-specific search** across names, certificate numbers, dates, and locations
- **Real-time filtering** with date ranges and quality scores
- **Bulk import capabilities** with data validation and error reporting

### 🏢 Cross-Department Collaboration
- **Multi-department access** with secure data boundaries
- **Real-time collaboration** between OAG departments
- **Unified data management** eliminating information silos
- **Comprehensive analytics** across all departments

### 📊 Data Quality & Analytics
- **Data quality scoring** with missing field tracking
- **Visual quality indicators** in table displays
- **Real-time analytics** on departmental performance
- **Import progress tracking** with detailed error reporting

## 🛠️ Technology Stack

- **Frontend**: Next.js 13.5.1 with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: TanStack Query with React Context
- **Authentication**: Supabase Auth with role-based access
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:mosesmrima/aog.git
   cd aog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── marriages/         # Marriage records management
│   └── admin/             # Admin-only pages
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── marriages/        # Marriage-specific components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   ├── supabase.ts      # Supabase client & types
│   └── bulk-import.ts   # Bulk import functionality
├── hooks/               # Custom React hooks
└── public/             # Static assets
```

## 🗄️ Database Schema

### Core Tables
- **user_profiles** - User information with admin/approval flags
- **departments** - OAG departments
- **user_departments** - Many-to-many user-department relationships
- **marriages** - Marriage registration records with quality tracking
- **audit_logs** - Complete activity tracking for compliance

### Key Features
- **Row Level Security (RLS)** for data isolation
- **Department-based access control**
- **Comprehensive audit logging**
- **Data quality tracking** with missing field indicators

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security Features

- **Role-based access control** (Admin vs Regular users)
- **Department-based data isolation**
- **Complete audit trails** for all data modifications
- **Secure file upload** with metadata tracking
- **Admin approval workflow** for new users

## 📈 Data Management

### Bulk Import
- **CSV file processing** with validation
- **Progress tracking** with real-time updates
- **Error reporting** with detailed feedback
- **Duplicate detection** and handling
- **Data quality assessment** during import

### Search & Filtering
- **Progressive search** for certificate numbers
- **Multi-field search** across all data
- **Advanced filtering** by date, quality, and department
- **Real-time results** with server-side processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software developed for the Office of the Attorney General.

## 🔧 Deployment

The application is designed to be deployed on Vercel with Supabase as the backend. Environment variables must be configured in the deployment environment.

## 📞 Support

For technical support or questions, contact the development team or your department administrator.

---

**Built with ❤️ for the Office of the Attorney General**