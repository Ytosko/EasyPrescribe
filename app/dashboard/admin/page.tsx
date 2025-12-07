"use client";

import { useState } from "react";
import { FiUsers, FiCalendar, FiGlobe } from "react-icons/fi";
import { clsx } from "clsx";
import AssistantManager from "@/components/admin/AssistantManager";
import AppointmentSettings from "@/components/admin/AppointmentSettings";
import LandingPageSettings from "@/components/admin/LandingPageSettings";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<"assistants" | "appointments" | "landing">("assistants");

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Admin Tools</h1>
                <p className="text-slate-500">Manage your assistants, appointments, and online presence.</p>
            </header>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("assistants")}
                        className={clsx(
                            "flex-1 py-4 text-center font-semibold transition-colors flex items-center justify-center gap-2",
                            activeTab === "assistants" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <FiUsers /> My Assistant
                    </button>
                    <button
                        onClick={() => setActiveTab("appointments")}
                        className={clsx(
                            "flex-1 py-4 text-center font-semibold transition-colors flex items-center justify-center gap-2",
                            activeTab === "appointments" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <FiCalendar /> Appointment Settings
                    </button>
                    <button
                        onClick={() => setActiveTab("landing")}
                        className={clsx(
                            "flex-1 py-4 text-center font-semibold transition-colors flex items-center justify-center gap-2",
                            activeTab === "landing" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <FiGlobe /> Landing Page
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "assistants" && (
                        <div className="animate-fade-in">
                            <AssistantManager />
                        </div>
                    )}
                    {activeTab === "appointments" && (
                        <div className="animate-fade-in">
                            <AppointmentSettings />
                        </div>
                    )}
                    {activeTab === "landing" && (
                        <div className="animate-fade-in">
                            <LandingPageSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
