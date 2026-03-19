# StEAM - Student Time and Attendance Management Portal
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: Polyform NC](https://img.shields.io/badge/License-Polyform%20NC%201.0.0-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)](.)
**Status:** Complete
**Version:** 1.0.0

A modern web application for tracking and managing student time and attendance in educational institutions. Built with React, TypeScript, and Supabase.

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

## Features

### Dashboard
- **Real-time late comers list** with pagination and sorting
- **Quick filters** - Today, Yesterday, This Week, This Month
- **Date range filtering** - Select custom from-to dates
- **Advanced filters** - Department, Batch, Section
- **Search** - Find students by name or register number
- **Statistics cards** - Total late, departments affected, top department, average per department
- **"How Late" column** - Shows lateness duration with color-coded badges
- **Delete late entries** - Admins can delete late entry records

### Student Management
- **All Students page** - View complete student directory
- **Lateness statistics** - Total late days and average lateness per student
- **Sortable columns** - Sort by name, register number, department, batch, section
- **Student details modal** - Click any student to view detailed information
- **Default sort** - List sorted by register number

### Student Details
- **Profile information** - Name, register number, course, department, specialization, batch, section
- **Lateness statistics** - Total late days, total lateness time, average lateness
- **Late history table** - Complete record of all late arrivals with timestamps
- **Default entry time** - 8:00 AM baseline for lateness calculations

### Admin Panel
- **Staff Management** - View, add, edit, and delete staff users
- **Staff Details Modal** - Click any staff to view detailed information with role permissions
- **Student Management** - Manage student records
- **Role-based access control** - Admin, Staff, and Floor Staff roles

### Additional Features
- **Dark mode** - Pitch black theme for OLED displays
- **Responsive design** - Works on desktop, tablet, and mobile
- **Export to CSV** - Download late comers report
- **Add late entry** - Record new late arrivals (floor staff/admin)
- **Role-based access** - Admin (full access), Staff (view only), Floor Staff (view + add entries)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom dark mode
- **State Management**: TanStack React Query v5
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/verycareful/Latecomers.git
   cd Latecomers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor. See [Database Setup](#database-setup) below.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to `http://localhost:5173` in your browser.

## Database Setup

### Tables

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Departments table
CREATE TABLE departments (
    department VARCHAR(100) PRIMARY KEY
);

-- Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_departments" ON departments
FOR SELECT TO authenticated USING (true);

-- Specializations table
CREATE TABLE specializations (
    department VARCHAR(100) REFERENCES departments(department),
    specialization VARCHAR(100),
    PRIMARY KEY (department, specialization)
);

-- Courses table
CREATE TABLE courses (
    course VARCHAR(50) PRIMARY KEY
);

-- Students table
CREATE TABLE students (
    register_number VARCHAR(15) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL REFERENCES courses(course),
    batch INT NOT NULL CHECK (batch >= 2000 AND batch <= 2100),
    department VARCHAR(100) NOT NULL REFERENCES departments(department),
    specialization VARCHAR(100) NOT NULL,
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (department, specialization) 
        REFERENCES specializations(department, specialization)
);

-- User details table (for staff/admin)
CREATE TABLE user_details (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL REFERENCES departments(department),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'floor_staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Late comings table
CREATE TABLE late_comings (
    register_number VARCHAR(15) NOT NULL REFERENCES students(register_number) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    registered_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (register_number, date)
);

-- Create indexes for performance
CREATE INDEX idx_students_batch ON students(batch);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_late_comings_date ON late_comings(date);
CREATE INDEX idx_late_comings_registered_by ON late_comings(registered_by);
CREATE INDEX idx_user_details_staff_id ON user_details(staff_id);
CREATE INDEX idx_user_details_role ON user_details(role);
```

### Dashboard View

Create a view for the dashboard:

```sql
CREATE VIEW late_comers_dashboard
WITH (security_invoker = true) AS
SELECT 
    s.register_number,
    s.name,
    s.department,
    s.section,
    s.batch,
    lc.date,
    lc.time,
    lc.registered_by,
    ud.name as registered_by_name,
    (SELECT COUNT(*)::integer FROM late_comings lc2 
     WHERE lc2.register_number = lc.register_number 
     AND lc2.date < lc.date) as previous_late_count
FROM late_comings lc
JOIN students s ON lc.register_number = s.register_number
LEFT JOIN user_details ud ON ud.id = lc.registered_by;

GRANT SELECT ON late_comers_dashboard TO authenticated;
```

### Row Level Security

Enable RLS for secure access:

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_comings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;

-- Students: anyone authenticated can view
CREATE POLICY "view_students" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_manage_students" ON students FOR ALL USING (true);

-- Late comings: anyone authenticated can view, authenticated users can insert/delete
CREATE POLICY "view_late_comings" ON late_comings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "manage_late_comings" ON late_comings FOR ALL USING (true);

-- User details: authenticated users can view all
CREATE POLICY "view_all_user_details" ON user_details FOR SELECT USING (true);
CREATE POLICY "manage_user_details" ON user_details FOR ALL USING (true);
```

### Supabase Auth Settings

For staff user creation to work from the frontend:
1. Go to **Authentication â†’ Providers â†’ Email**
2. **Disable** "Confirm email" to allow immediate user creation

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ Admin/          # Admin panel components
â”‚   â”‚   â”œâ”€â”€ AdminPanel.tsx
â”‚   â”‚   â”œâ”€â”€ StaffManagement.tsx
â”‚   â”‚   â”œâ”€â”€ StaffEditModal.tsx
â”‚   â”‚   â”œâ”€â”€ StudentManagement.tsx
â”‚   â”‚   â””â”€â”€ StudentEditModal.tsx
â”‚   â”œâ”€â”€ Auth/           # Login and protected routes
â”‚   â”œâ”€â”€ Dashboard/      # Main dashboard components
â”‚   â”‚   â”œâ”€â”€ Dashboard.tsx
â”‚   â”‚   â”œâ”€â”€ FilterBar.tsx
â”‚   â”‚   â”œâ”€â”€ LateComersTable.tsx
â”‚   â”‚   â”œâ”€â”€ StatsCards.tsx
â”‚   â”‚   â”œâ”€â”€ StudentDetailsModal.tsx
â”‚   â”‚   â”œâ”€â”€ StudentSearch.tsx
â”‚   â”‚   â””â”€â”€ AddLateEntryModal.tsx
â”‚   â”œâ”€â”€ Layout/         # App layout and header
â”‚   â”œâ”€â”€ Shared/         # Reusable components
â”‚   â””â”€â”€ Students/       # All students page
â”œâ”€â”€ hooks/              # Custom React hooks
â”‚   â”œâ”€â”€ useAuth.tsx
â”‚   â”œâ”€â”€ useAdmin.ts
â”‚   â”œâ”€â”€ useLateComers.ts
â”‚   â”œâ”€â”€ useStudentDetails.ts
â”‚   â””â”€â”€ useTheme.tsx
â”œâ”€â”€ lib/                # External service clients
â”‚   â””â”€â”€ supabase.ts
â”œâ”€â”€ types/              # TypeScript type definitions
â”‚   â””â”€â”€ database.types.ts
â”œâ”€â”€ utils/              # Utility functions
â”‚   â”œâ”€â”€ dateHelpers.ts
â”‚   â””â”€â”€ helpers.ts
â”œâ”€â”€ App.tsx             # Main app with routing
â”œâ”€â”€ main.tsx            # Entry point
â””â”€â”€ index.css           # Global styles
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

### Customization

- **Default entry time**: Edit `DEFAULT_ENTRY_TIME` in `src/hooks/useStudentDetails.ts` (default: 8:00 AM)
- **Theme colors**: Modify `tailwind.config.js` for custom color schemes
- **Dark mode**: Uses pitch black (#000000) background for OLED optimization

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Contributing

This project is currently under restricted use for educational institution integration. Please contact the maintainer before contributing.

## License

Copyright © 2026 Sricharan Suresh (github.com/verycareful)

This project is licensed under the **[Polyform Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)**.
You may use, copy, and modify this software for non-commercial purposes only.
Commercial use of any kind is prohibited without explicit written permission from the author.

See the [LICENSE](LICENSE) file for the full license text, or visit
[https://polyformproject.org/licenses/noncommercial/1.0.0/](https://polyformproject.org/licenses/noncommercial/1.0.0/).

For commercial licensing inquiries, contact [sricharanc03@gmail.com](mailto:sricharanc03@gmail.com).
## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/verycareful/Latecomers/issues) page.

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Heroicons](https://heroicons.com/)

