
# Lift Plan Review Platform

## Overview
A web app where lifting industry clients submit lift plans for third-party review by Appointed Persons. Includes client dashboard, reviewer dashboard, management stats, and integrated payments.

## Authentication & Roles
- Email & password signup/login
- Signup form collects: name, email, company name
- All users sign up as **Clients** by default
- Admins manually assign the **Appointed Person** role via a management screen
- Role-based routing: clients see Dashboard, appointed persons see Review Requests + Management

## Pages

### 1. Home (Landing Page)
- Professional landing page explaining the lift plan review service
- Hero section with tagline about compliance and safety in the lifting industry
- How it works section (Submit → Review → Completed)
- Equipment types supported (Tower Crane, Mobile Crane, Digger, Forklift, Hiab, MEWPs)
- Sign In / Sign Up buttons

### 2. Client Dashboard
- **Lift Plan List**: Table/cards showing all submitted lift plans with status badges (Submitted, Assigned, In Review, Request Info, Rejected, Completed)
- **Submit New Lift Plan** form:
  - Lift Plan Name/Reference (text)
  - Lift Plan Files (multi-file upload)
  - Description (text)
  - Payment Type: Purchase Order (PO) / Direct Payment (choice)
  - Equipment Type: Tower Crane/Mobile Crane, Digger, Forklift, Hiab, MEWPs (choice)
  - Timeframe: 24h, 48h, 72h (choice)
  - Name, email, company auto-filled from user profile
- **Lift Plan Detail Screen**: Full history/timeline of status changes with timestamps (uploaded, assigned, in review, etc.), any messages from the reviewer, and the final review document when completed

### 3. Review Requests (Appointed Person Dashboard)
- List of all submitted lift plans from clients
- Appointed person can assign a plan to themselves
- Status management with manual updates: Submitted → Assigned → In Review → Request Info / Rejected / Completed
- **Request Info**: Pop-up/modal where the reviewer types a message requesting more information from the client
- **Completed**: Pop-up/modal where the reviewer uploads the final review document
- Each plan shows full audit trail of changes

### 4. Management (Appointed Persons only)
- Stats: total reviews completed, reviews by status, reviews by equipment type
- Pricing overview and revenue tracking
- Filters by date range and appointed person

## Payments
- Stripe integration for direct payments
- PO option records the purchase order number (no online payment)
- Payment status tracked per lift plan

## Email Notifications
- Client receives email when: plan status changes (assigned, in review, info requested, rejected, completed)
- Appointed person receives email when: new plan submitted, client responds to info request

## Database (Lovable Cloud / Supabase)
- Profiles table (name, email, company)
- User roles table (client / appointed_person / admin)
- Lift plans table (reference, description, status, payment type, equipment type, timeframe, timestamps, assigned_to)
- Lift plan files (linked to lift plans, stored in Supabase Storage)
- Status history / audit log table
- Messages table (for Request Info communication)
- Review documents table (final uploaded review files)

## Tech Stack
- React + TypeScript + Tailwind + shadcn/ui
- Lovable Cloud (Supabase) for auth, database, storage, edge functions
- Stripe (built-in Lovable payments) for direct payments
- Lovable email for notifications
