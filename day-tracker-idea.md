# Day Tracker

A web application for daily self-reflection, allowing users to score their day and describe it in three words.

## Purpose

- A learning project built with Claude Code
- A mindfulness tool for tracking daily mood and patterns over time

## Core Features

### Daily Entry

- Displays the **current date** at the top of the entry screen
- Score your day on a scale of **1 to 10**
- Enter **three words** to describe the day
- **One entry per user per day** — if a submission already exists for today, the form is disabled and a message is displayed informing the user that they have already submitted for today

### Word Input

- Freeform text input (any word allowed)
- **No spaces allowed** — words must be single words without spaces
- **No duplicate words** — the same word cannot be entered twice in a single day's entry
- **Autocomplete suggestions** drawn from the user's own previously entered words
- Suggestions build up organically over time, creating a personal vocabulary

### Authentication

- **Simple username/password authentication**
- Two user accounts:
  - Username: `tom`
  - Username: `laura`
- Passwords stored as bcrypt hashes in the API code (not in database)
- Session-based authentication using JWT tokens
- **"Remember me" option** to stay logged in across browser sessions
- Login form shown on first visit
- Authentication protects both the frontend UI and API endpoints

### Multi-User Support

- After authentication, the app loads to a **2x2 grid of buttons**, one per family member
- Four fixed profiles: **Daddy**, **Mommy**, **Tabitha**, **Imogen**
- Below the 2x2 grid, a **"View Insights" button** for accessing the analytics dashboard
- Selecting a profile takes you to that user's daily entry screen
- Selecting the insights button takes you to the interactive dashboard
- Each profile has its own separate data and word history

### Interactive Dashboard

A built-in analytics page with **real-time filtering controls**:

**Interactive Controls:**
- **Date range filters**: "Last 7 days", "Last 30 days", "Last 90 days", "All time"
- **Custom date picker**: Select specific start and end dates
- **Profile filter**: View all family members or filter to one person
- Charts update instantly when filters change

**Visualizations:**
- **Score over time** — Line chart showing daily scores for each family member
- **Word frequency** — Bar chart of most-used words in the selected period
- **Average scores** — Summary statistics per person for the time period
- **Recent entries** — Paginated table of entries in the selected date range

**Technology:**
- Built with Recharts (React charting library)
- No separate services required (Grafana not needed)
- Works seamlessly on mobile and desktop
- Uses existing authentication

## Hosting

- Hosted on a **free Azure account**
- Accessible via the web

### Version Display

- A **version number** is displayed in the **top-right corner** of every page
- The version number is **automatically incremented** on each new build/deployment

## Scope

Intentionally minimal for the initial version:

- No journal entries, notes, or additional context
- No categories or tags beyond the three words
- No time-of-day tracking
- Focus on the core loop: enter, store, visualize
