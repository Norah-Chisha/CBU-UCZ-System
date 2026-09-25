# CBU-UCZ System

## Project Description

The CBU-UCZ System is a small membership registration and secretary dashboard for the CBU UCZ Fellowship. It captures member registration details, shows a simple dashboard summary, highlights birthdays, and supports member record searching and export actions.

## Current Structure

```text
CBU-UCZ-System/
├── .gitignore
├── README.md
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── register.js
│   │   └── dashboard.js
│   └── images/
│       ├── cbu-logo.svg
│       └── ucz-logo.svg
└── .git/
```

## Pages

- `index.html`: Membership registration page for new members.
- `dashboard.html`: Admin dashboard showing totals, birthday reminders, searchable member records, and export tools.

## JavaScript

- `js/register.js`: Handles member registration form validation and submission to the existing backend API.
- `js/dashboard.js`: Loads metrics, birthday reminders, member records, search/filter logic, and PDF export for the dashboard.

## CSS

- `css/style.css`: Shared styling for the registration page, dashboard cards, tables, buttons, and responsive layout.

## Assets

- Images are stored under `public/images/` and are standardized to lowercase hyphenated names.
- Existing branding assets were normalized to `cbu-logo.svg` and `ucz-logo.svg` to avoid case-sensitive deployment issues.

## Existing Backend Dependencies

These are the API dependencies that are currently referenced by the frontend and will need to be replaced during the Firebase migration stage:

- `GET /api/dashboard`: Used by the dashboard to load total member counts and birthday reminder sections.
- `GET /api/members`: Used by the dashboard to load, search, and filter member records.
- `POST /api/members`: Used by the registration form to submit a member registration record.
- `GET /api/export/csv`: Used by the dashboard export link to download the current member list as CSV.

## Cleanup Performed

- Standardized the project folder structure under `public/`.
- Moved shared CSS into `public/css/`.
- Moved JavaScript into `public/js/`.
- Normalized the image directory to `public/images/` and renamed assets to lower-case hyphenated names.
- Updated the HTML references so styles, scripts, and images resolve correctly.
- Removed the stale duplicate root-level ignore file and the case-sensitive `public/Images` folder to prevent broken Linux deployment paths.
- Kept the current behavior and business logic unchanged while preparing the app for Firebase migration.

## Firebase Integration Status

Firebase is already integrated for membership registration and the secretary dashboard. The project uses Firebase Auth and Firestore for the live registration and admin access flow, while the frontend remains a lightweight static app.
