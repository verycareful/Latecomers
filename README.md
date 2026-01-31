# Late Comers Tracker

A modern web application for tracking and managing student late arrivals in educational institutions. Built with React, TypeScript, and Supabase.

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

## Features

### Dashboard
- **Real-time late comers list** with pagination and sorting
- **Quick filters** - Today, Yesterday, This Week, This Month
- **Date range filtering** - Select custom from-to dates
- **Advanced filters** - Department, Year, Section
- **Search** - Find students by name or register number
- **Statistics cards** - Total late, departments affected, top department, average per department
- **"How Late" column** - Shows lateness duration with color-coded badges

### Student Management
- **All Students page** - View complete student directory
- **Lateness statistics** - Total late days and average lateness per student
- **Sortable columns** - Sort by name, department, year, late count, average lateness
- **Student details modal** - Click any student to view detailed information

### Student Details
- **Profile information** - Name, register number, department, year, section, batch
- **Lateness statistics** - Total late days, total lateness time, average lateness
- **Late history table** - Complete record of all late arrivals with timestamps
- **Default entry time** - 8:00 AM baseline for lateness calculations

### Additional Features
- **Dark mode** - Pitch black theme for OLED displays
- **Responsive design** - Works on desktop, tablet, and mobile
- **Export to CSV** - Download late comers report
- **Add late entry** - Record new late arrivals (floor staff)
- **Role-based access** - Staff (view only) and Floor Staff (view + add entries)

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
    department VARCHAR(20) PRIMARY KEY
);

-- Specializations table
CREATE TABLE specializations (
    department VARCHAR(20) REFERENCES departments(department),
    specialization VARCHAR(20),
    PRIMARY KEY (department, specialization)
);

-- Courses table
CREATE TABLE courses (
    course VARCHAR(10) PRIMARY KEY
);

-- Students table
CREATE TABLE students (
    register_number VARCHAR(15) PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    course VARCHAR(10) NOT NULL REFERENCES courses(course),
    batch INT NOT NULL,
    department VARCHAR(20) NOT NULL,
    specialization VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    semester INT NOT NULL,
    section CHAR(1) NOT NULL,
    FOREIGN KEY (department, specialization) 
        REFERENCES specializations(department, specialization)
);

-- Late comings table
CREATE TABLE late_comings (
    register_number VARCHAR(15) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    registered_by VARCHAR(20) NOT NULL,
    PRIMARY KEY (register_number, date),
    FOREIGN KEY (register_number) REFERENCES students(register_number)
);

-- Create index for performance
CREATE INDEX idx_late_comings_date_time ON late_comings(date, time);
```

### Dashboard View

Create a view for the dashboard:

```sql
CREATE VIEW late_comers_dashboard AS
SELECT 
    lc.register_number,
    s.name,
    s.department,
    s.section,
    s.year,
    lc.date,
    lc.time,
    lc.registered_by,
    (SELECT COUNT(*) FROM late_comings lc2 
     WHERE lc2.register_number = lc.register_number 
     AND lc2.date < lc.date) as previous_late_count
FROM late_comings lc
JOIN students s ON lc.register_number = s.register_number;
```

### Row Level Security (Optional)

Enable RLS for secure access:

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_comings ENABLE ROW LEVEL SECURITY;

-- Create policies as needed based on your authentication setup
```

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
├── components/
│   ├── Auth/           # Login and protected routes
│   ├── Dashboard/      # Main dashboard components
│   │   ├── Dashboard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── LateComersTable.tsx
│   │   ├── StatsCards.tsx
│   │   ├── StudentDetailsModal.tsx
│   │   ├── StudentSearch.tsx
│   │   └── AddLateEntryModal.tsx
│   ├── Layout/         # App layout and header
│   ├── Shared/         # Reusable components
│   └── Students/       # All students page
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx
│   ├── useLateComers.ts
│   ├── useStudentDetails.ts
│   └── useTheme.tsx
├── lib/                # External service clients
│   └── supabase.ts
├── types/              # TypeScript type definitions
│   └── database.types.ts
├── utils/              # Utility functions
│   ├── dateHelpers.ts
│   └── helpers.ts
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Global styles
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

This project is licensed under a restricted license. See the [LICENSE](LICENSE) file for details.

**Usage Restrictions:**
- This software is developed for educational institution use
- Commercial use, redistribution, or modification without explicit permission is prohibited
- Contact the maintainer for licensing inquiries

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/verycareful/Latecomers/issues) page.

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Heroicons](https://heroicons.com/)
