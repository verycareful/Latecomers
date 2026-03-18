# Changelog

All notable changes to StEAM will be documented here.

---

## [1.0.0] - 2026-03-18

### Project Complete

#### Status Update
- **Project Status:** Marked as complete. No further development planned.
- **License Change:** Transitioned from Proprietary License to Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
- **Version:** Bumped from alpha 1.b.1 to 1.0.0 (stable release)

#### Notes
- All planned features implemented and tested
- StEAM (Student Time and Attendance Management Portal) is ready for production. Although no further updates are planned, the project is open-source under CC BY-NC 4.0, allowing for non-commercial use and modifications with proper attribution. 
- See CC BY-NC 4.0 license for usage terms
- Project was not pursued further due to lack of institutional support.

---

## [alpha 1.b.1] - 2026-03-03

### Hotfix: Session Persistence & Authentication Stack

#### Fixed Issues
- **Fixed Session Persistence:** Browser session storage now properly restored on page load. Users remain logged in across page refreshes.
- **Fixed Auth State Race Condition:** `INITIAL_SESSION` event is now properly handled to restore persisted sessions from localStorage without hanging.
- **Fixed Infinite Loading Spinner:** Added 8-second timeout to `fetchUserDetails()` database query and 10-second fallback timeout to prevent indefinite "loading" state.
- **Optimized Auth Flow:** Prioritize `INITIAL_SESSION` for page load restoration; only process fresh `SIGNED_IN` logins afterward to avoid duplicate slow queries.

#### Technical Details
- Changed from broken `getSession()` approach to event-driven `onAuthStateChange` with proper `INITIAL_SESSION` handling
- `fetchUserDetails()` now races database query against 8-second timeout to gracefully handle slow Supabase responses
- Added 10-second fallback timeout to ensure loading state always clears, even if auth events are delayed

---

## [alpha 1.b.0] - 2026-03-03

### Major Security & Stability Fixes (Audit Report Implementation)

#### Security Fixes
- **Fixed Staff Creation Security Vulnerability:** Staff users are no longer created via insecure client-side `signUp()`. Now uses Edge Function with service role key to prevent session hijacking attacks.
- **Fixed Staff Deletion Vulnerability:** Deleted staff users are now completely removed from both `user_details` and `auth.users` tables (previously only removed from `user_details`, leaving ghost login credentials active).
- **Added Admin Route Protection:** `/admin` route now requires `admin` role; non-admin authenticated users are redirected to dashboard.

#### Authentication & UI Fixes
- **Fixed Authentication Hang:** Added 5-second fallback timer to prevent indefinite "Checking authentication..." spinner if Supabase is slow or cold-starting.
- **Fixed Role Flicker on Load:** User role is now properly awaited before clearing loading state, eliminating UI flicker of admin/floor staff controls.
- **Fixed Duplicate Auth Initialization:** Removed double-call to `fetchUserDetails` that occurred on app startup.

#### Data Integrity Fixes
- **Fixed Silent Cascade Delete:** Student deletion now properly throws if deleting related late_comings records fails, preventing orphaned database rows.
- **Added Duplicate Late Entry Prevention:** Attempting to record the same student as late on the same date now returns a user-friendly error instead of silent duplicates or raw Postgres errors.

#### Performance & Cleanup
- **Removed Debug Logging:** Removed `console.log` from `useDepartments()` hook.
- **Fixed Polling Interval:** Removed aggressive real-time subscriptions that caused race conditions; standardized polling to 30-second intervals.
- **Improved Time Period Filters:** All quick filter buttons (Today, Yesterday, This Week, This Month) now properly highlight when active.

---

## [alpha 1.a.3] - 2026-03-03

### Changed
- Updated theme color palette with custom CSS variables and Tailwind configuration
- **Light Mode:** Primary color changed to `#1e3b8a` (Blue), Secondary `#c9fa80` (Lime), Accent `#4ef99e` (Mint)
- **Dark Mode:** Primary `#1e3b8a` (Blue), Secondary `#8a1313` (Dark Red), Accent `#06b156` (Forest Green)
- Updated CSS custom properties (`--primary`, `--secondary`, `--accent`, `--text`, `--background`)
- Extended Tailwind color palette for all theme colors across light and dark modes

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
