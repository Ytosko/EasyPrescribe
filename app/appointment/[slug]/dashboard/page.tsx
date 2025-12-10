"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDatabase, ref, get } from "firebase/database";
import { FiLogOut, FiPlus, FiCalendar } from "react-icons/fi";
import { clsx } from "clsx";

import { NewAppointmentTab } from "./components/NewAppointmentTab";
import { ManagementTab } from "./components/ManagementTab";

export default function AssistantDashboard() {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === 'string' ? params.slug : '';

    const [session, setSession] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"new" | "manage">("new");

    // Auth Check
    useEffect(() => {
        const stored = localStorage.getItem("assistant_session");
        if (!stored) {
            router.replace(`/appointment/${slug}`);
            return;
        }
        setSession(JSON.parse(stored));
    }, [slug, router]);

    // Fetch Settings
    useEffect(() => {
        if (!session) return;
        const db = getDatabase();
        get(ref(db, `users/${session.doctorUid}/appointmentSettings`)).then((snap) => {
            if (snap.exists()) {
                setSettings(snap.val());
            } else {
                setSettings(null); // Should handle error
            }
        });
    }, [session]);

    const handleLogout = () => {
        localStorage.removeItem("assistant_session");
        router.push(`/appointment/${slug}`);
    };

    if (!session || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#007ACC] text-white flex items-center justify-center font-bold">
                            EP
                        </div>
                        <h1 className="font-bold text-lg hidden md:block">Appointment Manager</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-slate-800">{session.name}</div>
                            <div className="text-xs text-slate-500">Assistant ID: {session.username}</div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Sign Out">
                            <FiLogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                {/* Tabs */}
                <div className="grid grid-cols-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button
                        onClick={() => setActiveTab("new")}
                        className={clsx(
                            "py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === "new" ? "bg-[#007ACC] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <FiPlus className="text-lg" /> New Appointment
                    </button>
                    <button
                        onClick={() => setActiveTab("manage")}
                        className={clsx(
                            "py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === "manage" ? "bg-[#007ACC] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <FiCalendar className="text-lg" /> Appointment Management
                    </button>
                </div>

                {/* Content */}
                <div className="animate-fade-in">
                    {activeTab === "new" ? (
                        <NewAppointmentTab
                            session={session}
                            settings={settings}
                            onSuccess={() => setActiveTab("manage")}
                        />
                    ) : (
                        <ManagementTab session={session} settings={settings} />
                    )}
                </div>
            </div>
        </div>
    );
}
