import ContactForm from '@/components/contact/ContactForm';
import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingFooter from '@/components/layout/MarketingFooter';
import EasyPrescribeLogo from '@/components/ui/Logo';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';

export const metadata: Metadata = {
    title: 'Contact Us - Easy Prescribe',
    description: 'Get in touch with the Easy Prescribe team for support, sales, or general inquiries.',
};

export default function ContactPage() {
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

            <div className="flex-grow max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-16">

                {/* Contact Info */}
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Get in Touch</h1>
                    <p className="text-lg text-slate-600 mb-12">
                        Have questions about Easy Prescribe? Our team is here to help you get started or resolve any issues.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#007ACC] flex items-center justify-center flex-shrink-0 text-xl">
                                <FiMail />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Email Us</h3>
                                <p className="text-slate-600 mb-2">For general inquiries and support</p>
                                <a href="mailto:support@easyprescribe.app" className="text-[#007ACC] font-medium hover:underline">support@easyprescribe.app</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-xl">
                                <FiMapPin />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Office</h3>
                                <p className="text-slate-600">
                                    Dhaka, Bangladesh<br />
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xl">
                                <FiPhone />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Call Us</h3>
                                <p className="text-slate-600 mb-2">Mon-Fri from 9am to 6pm</p>
                                <a href="tel:+8801234567890" className="text-[#007ACC] font-medium hover:underline">+880 1234 567 890</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form Component */}
                <ContactForm />
            </div>

            <MarketingFooter />
        </main>
    );
}
