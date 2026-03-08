## How the System Works

The BrightSmile Dental Clinic system is a full-stack web application built with **Next.js and Supabase**.

### Frontend
The frontend is built using **Next.js (App Router)** and **React**.

Pages include:

- Home
- Book Appointment
- My Appointments
- About Us
- Admin Dashboard

The UI communicates with Supabase using the Supabase JavaScript client.

### Backend
Supabase provides the backend services:

- Authentication (login/signup)
- PostgreSQL database
- Row Level Security
- File storage for service images

### Route Protection

Middleware ensures secure access:

- `/book` and `/appointments` require login
- `/admin/*` requires admin role

If a logged-in user visits `/login`, they are redirected to the appropriate dashboard.

### Booking Flow

1. Patient logs in
2. Patient opens `/book`
3. App loads services and unavailable clinic dates
4. Patient selects service, date, and time
5. System validates:
   - not Sunday
   - not past date
   - not unavailable date
   - slot not already taken
6. If valid, a new appointment row is inserted in the database
7. Patient can view booking in `/appointments`
