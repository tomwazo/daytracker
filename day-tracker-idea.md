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
- **Autocomplete suggestions** drawn from the user's own previously entered words
- Suggestions build up organically over time, creating a personal vocabulary

### Multi-User Support

- **Landing page** displays a **sign-in form** using **SSO** (Single Sign-On)
- Sign-in is restricted to **allowed email addresses only** — currently only `tom87moore@gmail.com`
- Unauthorized emails are rejected with an error message after sign-in
- Upon successful sign-in, the user is presented with a **2x2 grid of buttons**, one per family member
- Four fixed profiles: **Daddy**, **Mommy**, **Tabitha**, **Imogen**
- Below the 2x2 grid, a **fifth button** for **viewing the Grafana dashboards**
- Selecting a profile takes you to that user's daily entry screen
- Selecting the dashboard button takes you to the Grafana visualizations
- Each profile has its own separate data and word history

### Grafana Dashboards

Four visualizations for exploring your data:

- **Score over time** — line chart tracking your daily score
- **Word frequency** — bar chart showing which words you use most often
- **Words over time** — timeline showing which words appeared on which days
- **Word cloud** — visual display where more frequent words appear larger

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
