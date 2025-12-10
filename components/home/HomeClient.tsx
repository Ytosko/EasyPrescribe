"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FiCheck, FiShield, FiActivity, FiZap, FiUsers, FiTrendingUp, FiArrowRight, FiStar, FiClock, FiLock, FiGlobe, FiSmartphone } from "react-icons/fi";
import { motion } from "framer-motion";
import EasyPrescribeLogo from "@/components/ui/Logo";
import MarketingFooter from "@/components/layout/MarketingFooter";

export default function HomeClient() {
    const { user, loading } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (loading) return null;

    const features = [
        {
            icon: <FiZap className="w-6 h-6" />,
            title: "Lightning Fast",
            description: "Create prescriptions in seconds, not minutes",
            color: "from-amber-500 to-orange-500"
        },
        {
            icon: <FiShield className="w-6 h-6" />,
            title: "Bank-Grade Security",
            description: "Your data is encrypted and secure",
            color: "from-emerald-500 to-teal-500"
        },
        {
            icon: <FiUsers className="w-6 h-6" />,
            title: "Patient Management",
            description: "Track patients and appointments effortlessly",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: <FiGlobe className="w-6 h-6" />,
            title: "Access Anywhere",
            description: "Cloud-based, accessible from any device",
            color: "from-purple-500 to-pink-500"
        }
    ];

    const stats = [
        { value: "99.9%", label: "Uptime" },
        { value: "10K+", label: "Prescriptions" },
        { value: "500+", label: "Doctors" },
        { value: "24/7", label: "Support" }
    ];

    return (
        <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm" : "bg-transparent"}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-[#007ACC] flex items-center gap-2 group">
                        <EasyPrescribeLogo className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent">Easy Prescribe</span>
                    </Link>
                    <div className="flex gap-4 items-center">
                        {user ? (
                            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-slate-600 hover:text-[#007ACC] font-semibold transition-colors hidden md:block">Log In</Link>
                                <Link href="/signup" className="btn-primary px-6 py-2.5 text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">Get Started Free</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - Enhanced */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-left"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#007ACC] text-sm font-bold mb-8 border border-blue-100/50 backdrop-blur-sm shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007ACC] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007ACC]"></span>
                            </span>
                            Trusted by 500+ Healthcare Professionals
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                            The Future of <br />
                            <span className="bg-gradient-to-r from-[#007ACC] via-blue-500 to-cyan-500 bg-clip-text text-transparent">Digital Prescriptions</span>
                        </h1>

                        <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-xl">
                            Create professional prescriptions in seconds. Manage patients effortlessly. Experience the modern way to practice medicine.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Link
                                href="/signup"
                                className="group relative px-8 py-4 bg-gradient-to-r from-[#007ACC] to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:-translate-y-1"
                            >
                                <span className="flex items-center gap-2">
                                    Start Free Trial
                                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                            <Link
                                href="#features"
                                className="px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-blue-300 flex items-center gap-2 justify-center"
                            >
                                See How It Works
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">10k+</div>
                                <div className="text-sm text-slate-500 font-medium">Prescriptions Created</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-900">99.9%</div>
                                <div className="text-sm text-slate-500 font-medium">Uptime Guarantee</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-xl">
                            <img
                                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2000"
                                alt="Doctor using digital tablet"
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                            {/* Floating Card Element */}
                            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <FiCheck size={24} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Prescription Sent!</div>
                                    <div className="text-xs text-slate-500">Just now • Dr. Sarah Johnson</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl"></div>
                        <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-purple-400/30 rounded-full blur-3xl"></div>
                    </motion.div>
                </div>
            </section>

            {/* About Section - New */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl">
                        <img
                            src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=1000"
                            alt="Medical professionals working"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="order-1 lg:order-2">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Designed for the <span className="text-[#007ACC]">Modern Clinic</span></h2>
                        <div className="space-y-6 text-lg text-slate-600">
                            <p>
                                Gone are the days of illegible handwriting and lost records. Easy Prescribe empowers you to generate comprehensive digital prescriptions in seconds.
                            </p>
                            <p>
                                Our platform is built with one goal: to let you focus on what matters most—your patients. We handle the paperwork, analytics, and security.
                            </p>
                            <ul className="grid grid-cols-2 gap-4 pt-4">
                                {[
                                    "Smart Templates", "Cloud Sync",
                                    "Patient History", "Analytics Dashboard",
                                    "Secure Database", "Mobile Friendly"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 font-semibold text-slate-800">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                                            <FiCheck />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features Section - Premium Cards */}
            <section id="features" className="py-20 px-6 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Powerful tools to streamline your entire medical practice
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative bg-white p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Get Started in <span className="bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent">3 Simple Steps</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10"></div>
                        {[
                            { step: "01", title: "Sign Up", desc: "Create your free account in under 30 seconds", icon: <FiUsers /> },
                            { step: "02", title: "Set Up Profile", desc: "Add your credentials and clinic details", icon: <FiActivity /> },
                            { step: "03", title: "Start Prescribing", desc: "Create your first professional prescription", icon: <FiCheck /> }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.2 }}
                                viewport={{ once: true }}
                                className="relative text-center bg-white p-6"
                            >
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-blue-100 text-[#007ACC] flex items-center justify-center mb-6 text-2xl shadow-lg relative z-10">
                                    {item.icon}
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#007ACC] text-white flex items-center justify-center text-sm font-bold border-2 border-white">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="relative bg-gradient-to-r from-[#007ACC] to-blue-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to Transform Your Practice?
                            </h2>
                            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                                Join hundreds of doctors who have already made the switch to digital prescriptions
                            </p>
                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#007ACC] font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                            >
                                Get Started for Free
                                <FiArrowRight />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <MarketingFooter />
        </main>
    );
}
