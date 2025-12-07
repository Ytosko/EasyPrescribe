# Dummy Data Population Guide

I've created automation scripts, but they require Firebase configuration. Here's a manual alternative or you can run the script after setup.

## Method 1: Quick Manual Entry (Recommended)

I can create a simpler approach - let me know if you'd like me to:
1. Create a web UI page at `/admin/populate-data` where you can click a button to generate the data
2. This will use your existing Firebase connection

## Method 2: Run the Script

### Prerequisites:
```bash
npm install dotenv
```

### Create .env.local file with your Firebase config:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run:
```bash
node scripts/populate-dummy-data.mjs
```

## What Will Be Created:

**50 Patients:**
- Bangladeshi names (Abdul Ahmed, Fatima Khan, etc.)
- Random phone numbers (013-019 prefixes)
- Ages 10-80
- Mixed Male/Female
- Dhaka addresses (Dhanmondi, Gulshan, etc.)

**100 Appointments:**
- Distributed across Dec 6-10, 2025 (20 per day)
- Order numbers 1-20 for each day
- Created by: Rohim Uddin (Assistant)
- Random patients from the 50 created
- Activity logs generated

Would you like me to create Method 1 (the web UI button approach)? That would be the easiest!
