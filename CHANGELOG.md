# Changelog

All notable changes to StEAM will be documented here.

---

## [alpha 1.a.2] - 2026-03-01

### Removed
- `card_id` field fully removed from the student schema, types, hooks, and all UI components following its removal from the database
  - Removed from `database.types.ts` (`Row`, `Insert`, `Update`)
  - Removed from `StudentInput` interface in `useAdmin.ts`
  - Removed from CSV and Excel parsing logic
  - Removed from `useStudentDetails.ts` fallback student objects and `StudentWithStats`
  - Removed Card column and sort case from `StudentManagement.tsx`
  - Removed Card Status section and related `useAuth`/`setValue` usage from `StudentEditModal.tsx`
  - Removed Card ID preview column and `showCardColumn` logic from `StudentUploadModal.tsx`

### Fixed
- TypeScript build errors caused by residual `card_id` references after database column removal

---

## [alpha 1.a.1] - 2026-02-27

### Added
- `card_id` column support — display Card Registered status in admin student table (later reverted in 1.a.2)
- Sorting by Card status column in student management table
- Default sort in student management table changed from name to register number
- `card_id` field added to `Student` type and `StudentInput` interface
- CSV/Excel upload parsers updated to optionally read `card_id` column
- Admin-only ability to clear a student's `card_id` via the edit modal

---

## [alpha 1.a.0] - 2026-02-26

### Added
- Initial release under StEAM branding (Student Time and Attendance Management Portal)
- Dashboard with real-time late comers list, filters, sorting, and statistics
- Student management with lateness statistics and details modal
- Admin panel with staff management and role-based access control
- Dark mode (OLED-optimised pitch black theme)
- CSV/Excel bulk student upload
- Export late comers to CSV
- Role-based access: Admin, Staff, Floor Staff
