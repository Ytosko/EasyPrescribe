# Medical Profiler (Easy Prescribe)

This is a **Next.js 16** application designed for medical professionals to manage patient profiles, generate prescriptions, and utilize AI-powered suggestions.

## 🚀 features

- **Patient Profiling**: Manage patient data and history.
- **AI Suggestions**: Powered by Google **Gemini AI** for diagnostic tests, advice, and medicine suggestions.
- **Prescription Generation**: Generate PDF prescriptions using JSReport.
- **Doctor Landing Pages**: Dynamic public profiles for doctors.
- **Cloud Storage**: Secure file uploads using **AWS S3** and **Firebase Storage**.
- **Real-time Database**: Data synchronization with **Firebase Realtime Database**.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth & Database**: [Firebase](https://firebase.google.com/)
- **File Storage**: AWS S3 & Firebase Storage
- **AI**: Google Gemini
- **PDF Generation**: JSReport

## 📋 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd medical-profiler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory by copying the example file:

```bash
cp env.example .env.local
```

Open `.env.local` and fill in the required environment variables:

- **Firebase Config**: API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID, Measurement ID, Database URL.
- **AWS S3**: Region, Endpoint, Access Key, Secret Key, Bucket Name, Public URL Prefix.
- **Gemini AI**: API Key.
- **External Services**: JSReport URL, Base URL.

> **Note**: For local development, you can use the default values provided in the example for some non-sensitive fields if applicable, but for full functionality, valid credentials are required.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality.

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable React components.
- `lib/`: Utility functions and configuration (Firebase, S3, Prisma).
- `public/`: Static assets.
- `prescriptions/`: Templates or assets related to prescriptions.

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
