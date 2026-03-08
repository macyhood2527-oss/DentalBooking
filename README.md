# BrightSmile Dental Clinic Booking System

A modern dental clinic appointment booking system built with **Next.js, Supabase, and Tailwind CSS**.

The platform allows patients to easily book dental services online while giving clinic administrators full control over appointments, services, and clinic availability.

---

# Features

## Patient Features
- View available dental services
- Book appointments online
- View appointment history
- Real-time available time slots
- Prevent double booking
- Block unavailable clinic dates

## Admin Features
- Admin dashboard overview
- Manage dental services
- Upload service images
- Manage appointments
- Change appointment status
- Manage clinic unavailable dates
- Homepage gallery manager
- Editable About Us content

---

# Tech Stack

Frontend
- Next.js (App Router)
- React
- Tailwind CSS

Backend
- Supabase
- PostgreSQL
- Row Level Security

Storage
- Supabase Storage (service images)

Authentication
- Supabase Auth

Deployment
- Vercel

---

# System Architecture
Next.js Frontend
|
| Supabase Client
|
Supabase Backend
├── PostgreSQL Database
├── Authentication
└── Storage (Images)


---

# Database Tables

## profiles
Stores user profile data

Fields:
- id
- full_name
- email
- phone
- role

Roles:
- patient
- admin

---

## services
Dental services offered by the clinic

Fields:
- id
- name
- description
- price
- duration_minutes
- image_url
- is_active

---

## appointments
Stores booking transactions

Fields:
- id
- user_id
- service_id
- appointment_date
- appointment_time
- status
- notes

Statuses:
- pending
- confirmed
- completed
- cancelled

---

## unavailable_dates
Used to block clinic schedules such as holidays.

Fields:
- id
- date
- reason

---

# Local Development Setup

Clone the repository
git clone https://github.com/YOUR_USERNAME/DentalBooking.git


Install dependencies


npm install


Run development server


npm run dev


App will run on


http://localhost:3000


---

# Environment Variables

Create a `.env.local` file and add:


NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


---

# Deployment

The application is deployed using **Vercel**.

Steps:

1. Push repository to GitHub
2. Import project into Vercel
3. Add environment variables
4. Deploy

---

# Future Improvements

- Admin calendar view
- Appointment reminders
- Email notifications
- Dentist schedule management
- Patient profile management
- Advanced analytics dashboard

---

# Author

Built by **Melissa Marcelo**

Full-stack developer passionate about building useful real-world applications.
