import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingFooter from '@/components/layout/MarketingFooter';
import EasyPrescribeLogo from '@/components/ui/Logo';

export const metadata: Metadata = {
    title: 'Privacy Policy - Easy Prescribe',
    description: 'Privacy Policy for Easy Prescribe. Learn how we handle your data, patient privacy, and security.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Simple Navbar */}
            <nav className="bg-white border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-[#007ACC] flex items-center gap-2">
                        <EasyPrescribeLogo className="w-8 h-8" />
                        <span className="bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent">Easy Prescribe</span>
                    </Link>
                    <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Back to Home</Link>
                </div>
            </nav>

            <div className="flex-grow max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
                <div className="prose prose-slate max-w-none text-slate-600">
                    <p className="lead text-xl text-slate-500 mb-8">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>

                    <h3>1. Introduction</h3>
                    <p>
                        Welcome to Easy Prescribe ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal and medical data. This Privacy Policy explains how we collect, use, and safeguard your information.
                    </p>

                    <h3>2. Information We Collect</h3>
                    <p>We collect information to provide better services to all our users:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, phone number, and professional credentials provided during signup.</li>
                        <li><strong>Patient Data:</strong> Information you enter about your patients (Name, Age, prescriptions). You retain full ownership of this data.</li>
                        <li><strong>Usage Data:</strong> Information on how you use the platform (e.g., number of prescriptions created) to improve performance.</li>
                    </ul>

                    <h3>3. How We Use Information</h3>
                    <p>
                        Your data is used solely to facilitate the prescription generation process and account management.
                        <strong>We do not share patient data with third parties for marketing purposes.</strong>
                    </p>

                    <h3>4. Data Security</h3>
                    <p>
                        We implement industry-standard security measures, including encryption and secure server infrastructure, to protect your data from unauthorized access. However, no internet service is 100% secure, and we cannot guarantee absolute security.
                    </p>

                    <h3>5. Your Rights</h3>
                    <p>
                        You have the right to access, correct, or delete your account information at any time. For patient data deletion requests, please contact our support team.
                    </p>

                    <h3>6. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@easyprescribe.app">support@easyprescribe.app</a>.
                    </p>
                </div>
            </div>

            <MarketingFooter />
        </main>
    );
}
