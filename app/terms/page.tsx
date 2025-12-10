import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingFooter from '@/components/layout/MarketingFooter';
import EasyPrescribeLogo from '@/components/ui/Logo';

export const metadata: Metadata = {
    title: 'Terms of Service - Easy Prescribe',
    description: 'Terms of Service for using Easy Prescribe digital prescription platform.',
};

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
                <div className="prose prose-slate max-w-none text-slate-600">
                    <p className="lead text-xl text-slate-500 mb-8">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing or using Easy Prescribe, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
                    </p>

                    <h3>2. Use of Service</h3>
                    <p>
                        Easy Prescribe is a tool for licensed medical professionals. You represent and warrant that you hold a valid medical license in your jurisdiction to prescribe medication.
                    </p>

                    <h3>3. Medical Advice Disclaimer</h3>
                    <p>
                        <strong>Easy Prescribe is a software tool, not a medical device or a substitute for professional medical judgment.</strong> You are solely responsible for verifying the accuracy of all prescriptions, dosages, and patient instructions generated through the platform. We assume no liability for medical errors.
                    </p>

                    <h3>4. Account Responsibilities</h3>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
                    </p>

                    <h3>5. Subscription and Payments</h3>
                    <p>
                        We may offer free and paid subscription tiers. Paid subscriptions are billed in advance. Refunds are handled on a case-by-case basis as per our Refund Policy.
                    </p>

                    <h3>6. Termination</h3>
                    <p>
                        We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the service, us, or third parties, or for any other reason.
                    </p>

                    <h3>7. Changes to Terms</h3>
                    <p>
                        We reserve the right to modify these terms at any time. Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service.
                    </p>
                </div>
            </div>

            <MarketingFooter />
        </main>
    );
}
