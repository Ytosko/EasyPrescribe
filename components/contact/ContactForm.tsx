"use client";

import { FormEvent } from "react";

export default function ContactForm() {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Here you would add the logic to send the email/message
        console.log("Form submitted");
        alert("Thanks for your message! This is a demo form.");
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input type="text" id="name" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#007ACC] focus:ring-1 focus:ring-[#007ACC] outline-none transition" placeholder="Dr. John Doe" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#007ACC] focus:ring-1 focus:ring-[#007ACC] outline-none transition" placeholder="doctor@clinic.com" />
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select id="subject" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#007ACC] focus:ring-1 focus:ring-[#007ACC] outline-none transition">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing Question</option>
                        <option>Feature Request</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea id="message" rows={4} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#007ACC] focus:ring-1 focus:ring-[#007ACC] outline-none transition" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="w-full bg-[#007ACC] hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/20">
                    Send Message
                </button>
            </form>
        </div>
    );
}
