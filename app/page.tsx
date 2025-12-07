"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FiCheck, FiShield, FiActivity, FiZap, FiUsers, FiTrendingUp, FiArrowRight, FiStar, FiClock, FiLock, FiGlobe, FiSmartphone } from "react-icons/fi";
import { motion } from "framer-motion";
import EasyPrescribeLogo from "@/components/ui/Logo";

export default function Home() {
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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 text-[#007ACC] text-sm font-bold mb-8 border border-blue-100/50 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007ACC] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007ACC]"></span>
              </span>
              Trusted by 500+ Healthcare Professionals
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
              <span className="text-slate-900">The Future of</span>
              <br />
              <span className="bg-gradient-to-r from-[#007ACC] via-blue-500 to-cyan-500 bg-clip-text text-transparent">Medical Records</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed mb-12 max-w-3xl mx-auto">
              Create professional prescriptions in seconds. Manage patients effortlessly. Powered by cutting-edge technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/signup"
                className="group relative px-8 py-4 bg-gradient-to-r from-[#007ACC] to-blue-600 text-white text-lg font-bold rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/60 transition-all hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200 hover:border-blue-300"
              >
                Explore Features
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Premium Cards */}
      <section id="features" className="py-20 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">
              Built for <span className="bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent">Modern Healthcare</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to streamline your medical practice
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
                className="group relative bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all hover:shadow-2xl hover:-translate-y-1"
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
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">
              Get Started in <span className="bg-gradient-to-r from-[#007ACC] to-blue-600 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign Up", desc: "Create your account in under 30 seconds", icon: <FiUsers /> },
              { step: "02", title: "Set Up Profile", desc: "Add your credentials and preferences", icon: <FiActivity /> },
              { step: "03", title: "Start Prescribing", desc: "Create your first prescription", icon: <FiCheck /> }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-8xl font-bold text-blue-100 absolute -top-4 -left-4 -z-10">{item.step}</div>
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007ACC] to-blue-600 text-white flex items-center justify-center mb-4 text-2xl">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
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
            <div className="absolute inset-0 bg-grid-white/10"></div>
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
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <EasyPrescribeLogo className="w-8 h-8 text-white" />
              <div className="text-xl font-bold">Easy Prescribe</div>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 Easy Prescribe. Empowering healthcare professionals.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
