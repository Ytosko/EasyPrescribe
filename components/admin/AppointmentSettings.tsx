"use client";

import { useState, useEffect } from "react";
import { getDatabase, ref, set, get } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { FiSave, FiCheck, FiLink, FiCopy } from "react-icons/fi";
import { clsx } from "clsx";

interface AppointmentConfig {
    isActive: boolean;
    slug: string;
    dailyLimit: number;
    maxFutureDays: number;
    allowCrossAssistant: boolean;
    requiredFields: {
        name: boolean;
        phone: boolean;
        age: boolean;
        sex: boolean;
        address: boolean;
    };
}

export default function AppointmentSettings() {
    const { user } = useAuth();
    const [config, setConfig] = useState<AppointmentConfig>({
        isActive: false,
        slug: "",
        dailyLimit: 20,
        maxFutureDays: 3,
        allowCrossAssistant: false,
        requiredFields: {
            name: true,
            phone: true,
            age: true,
            sex: true,
            address: false
        }
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!user) return;
            const db = getDatabase();
            const snapshot = await get(ref(db, `users/${user.uid}/appointmentSettings`));
            if (snapshot.exists()) {
                setConfig(snapshot.val());
            } else {
                // Generate a default slug from user name or ID if possible, sanitizing strict characters
                const defaultSlug = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') || "";
                setConfig(prev => ({ ...prev, slug: defaultSlug }));
            }
        };
        fetchConfig();
    }, [user]);

    const checkSlug = async (slug: string) => {
        // In a real app, we'd check a global 'slugs' collection to ensure uniqueness.
        // For this simple version, we'll just assume it's available if it's 3+ chars
        return slug.length >= 3;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSaved(false);

        try {
            const db = getDatabase();
            await set(ref(db, `users/${user.uid}/appointmentSettings`), config);

            // Save global slug mapping for lookup
            if (config.slug) {
                await set(ref(db, `appointment_slugs/${config.slug}`), user.uid);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/appointment/${config.slug}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 w-full">
            {/* Slug Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007ACC] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FiLink className="text-[#007ACC]" /> Appointment Portal
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Configuring your dedicated booking website for assistants.</p>
                    </div>
                </div>

                <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <h4 className="font-semibold text-slate-800">Activate Portal</h4>
                        <p className="text-sm text-slate-500">Enable this to allow access to the booking page.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.isActive}
                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007ACC]"></div>
                    </label>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Create your unique link</label>
                    <p className="text-xs text-slate-500 mb-3">Choose a simple name (e.g. your clinic name) for your portal address.</p>
                    <div className="flex items-center max-w-xl">
                        <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg px-4 py-3 text-slate-500 font-mono text-sm">/appointment/</span>
                        <input
                            type="text"
                            className="flex-1 border border-slate-300 rounded-r-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ACC] focus:ring-2 focus:ring-blue-100 font-medium"
                            value={config.slug}
                            onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            placeholder="my-clinic-name"
                        />
                    </div>
                    {config.slug && (
                        <div className="mt-4 flex flex-row items-center gap-4">
                            <button type="button" className="btn-secondary text-xs py-2 px-3 flex items-center gap-2" onClick={copyLink}>
                                <FiCopy /> Copy Link
                            </button>
                            <a
                                href={`${window.location.origin}/appointment/${config.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#007ACC] hover:underline inline-flex items-center gap-1 font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors hover:bg-blue-100"
                            >
                                Open Link <FiLink />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Constraints */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Booking Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Daily Total Appointments</label>
                        <input
                            type="number"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                            value={config.dailyLimit}
                            onChange={(e) => setConfig({ ...config, dailyLimit: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Total combined limit for all assistants.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Advance Booking Days</label>
                        <input
                            type="number"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                            value={config.maxFutureDays}
                            onChange={(e) => setConfig({ ...config, maxFutureDays: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-slate-400 mt-1">How many days in future can they book?</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="crossAssistant"
                        checked={config.allowCrossAssistant}
                        onChange={(e) => setConfig({ ...config, allowCrossAssistant: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="crossAssistant" className="text-sm text-slate-700">Allow assistants to manage each other's appointments</label>
                </div>
            </div>

            {/* Patient Fields */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Patient Information Required</h3>
                <p className="text-sm text-slate-500 mb-4">Select the information assistants must collect when booking.</p>
                <div className="space-y-3">
                    {Object.entries(config.requiredFields).map(([field, checked]) => (
                        <div key={field} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={`field-${field}`}
                                checked={checked}
                                onChange={(e) => setConfig({
                                    ...config,
                                    requiredFields: {
                                        ...config.requiredFields,
                                        [field as keyof typeof config.requiredFields]: e.target.checked
                                    }
                                })}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                disabled={field === 'name' || field === 'phone'} // Always required
                            />
                            <label htmlFor={`field-${field}`} className="text-sm capitalize text-slate-700 flex items-center gap-2">
                                {field}
                                {(field === 'name' || field === 'phone') && <span className="text-xs text-slate-400">(Always required)</span>}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary min-w-[150px]"
                >
                    {loading ? "Saving..." : saved ? <><FiCheck className="mr-2" /> Saved!</> : <><FiSave className="mr-2" /> Save Settings</>}
                </button>
            </div>
        </form>
    );
}
