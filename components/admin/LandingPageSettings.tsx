"use client";

import { useState, useEffect } from "react";
import { getDatabase, ref, set, get } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { FiSave, FiCheck, FiGlobe, FiCopy, FiImage, FiUpload, FiTrash2, FiLink } from "react-icons/fi";
import { clsx } from "clsx";

interface LandingConfig {
    isActive: boolean;
    slug: string;
    themeColor: string; // Hex code
    bookingNumbers: string[]; // List of additional numbers
    showAssistantNumbers: boolean; // Option to pull from assistants
    profileImageDetails: string; // Just a placeholder for now, user asked to "choose profile picture", we'll do URL for simplicity
    topAffiliation: string;
    showChamber: boolean;
}

export default function LandingPageSettings() {
    const { user } = useAuth();
    const [config, setConfig] = useState<LandingConfig>({
        isActive: false,
        slug: "",
        themeColor: "#007ACC",
        bookingNumbers: [""],
        showAssistantNumbers: true,
        profileImageDetails: "",
        topAffiliation: "",
        showChamber: true
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [affiliations, setAffiliations] = useState<{ title: { en: string }, institute: { en: string } }[]>([]);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!user) return;
            const db = getDatabase();

            // Fetch Profile for Affiliations
            const profileSnap = await get(ref(db, `users/${user.uid}/profile`));
            if (profileSnap.exists()) {
                const p = profileSnap.val();
                if (p.affiliations) {
                    setAffiliations(p.affiliations);
                }
            }

            const snapshot = await get(ref(db, `users/${user.uid}/landingSettings`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                setConfig({
                    ...data,
                    bookingNumbers: data.bookingNumbers || [""],
                    showChamber: data.showChamber !== undefined ? data.showChamber : true,
                    topAffiliation: data.topAffiliation || ""
                });
            } else {
                // Generate a default slug from user name or ID if possible, sanitizing strict characters
                const defaultSlug = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') || "";
                setConfig(prev => ({ ...prev, slug: defaultSlug }));
            }
        };
        fetchConfig();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSaved(false);

        try {
            const db = getDatabase();

            // Clean up empty numbers
            const validCustomNumbers = config.bookingNumbers.filter(n => n.trim() !== "");
            const cleanConfig = {
                ...config,
                bookingNumbers: validCustomNumbers
            };

            // Validation for Publishing (Active State)
            if (cleanConfig.isActive) {
                if (!cleanConfig.profileImageDetails) {
                    alert("Cannot publish: A profile picture is required.");
                    setLoading(false);
                    return;
                }

                let hasValidContact = validCustomNumbers.length > 0;

                // If relying on assistants, verify they actually exist
                if (!hasValidContact && cleanConfig.showAssistantNumbers) {
                    const assistantsSnapshot = await get(ref(db, `users/${user.uid}/assistants`));
                    if (assistantsSnapshot.exists() && assistantsSnapshot.size > 0) {
                        hasValidContact = true;
                    }
                }

                if (!hasValidContact) {
                    alert("Cannot publish: You must provide at least one contact number (either a custom number or an assistant).");
                    setLoading(false);
                    return;
                }
            }

            await set(ref(db, `users/${user.uid}/landingSettings`), cleanConfig);

            // Save global slug mapping for looku
            if (cleanConfig.slug) {
                await set(ref(db, `doctor_slugs/${cleanConfig.slug}`), user.uid);
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

    const addNumber = () => setConfig(prev => ({ ...prev, bookingNumbers: [...prev.bookingNumbers, ""] }));

    const updateNumber = (index: number, val: string) => {
        const newNums = [...config.bookingNumbers];
        newNums[index] = val;
        setConfig(prev => ({ ...prev, bookingNumbers: newNums }));
    };

    const copyLink = () => {
        const url = `${window.location.origin}/doctor/${config.slug}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 w-full">
            {/* Slug Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#007ACC] transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007ACC] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FiGlobe className="text-[#007ACC]" /> Public Landing Page
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Manage your public profile page that patients will see.</p>
                    </div>
                </div>

                <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <h4 className="font-semibold text-slate-800">Publish Landing Page</h4>
                        <p className="text-sm text-slate-500">Enable this to make your profile visible to the public.</p>
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
                    <p className="text-xs text-slate-500 mb-3">Patients can visit this link to see your details.</p>
                    <div className="flex items-center max-w-xl">
                        <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg px-4 py-3 text-slate-500 font-mono text-sm">/doctor/</span>
                        <input
                            type="text"
                            className="flex-1 border border-slate-300 rounded-r-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ACC] focus:ring-2 focus:ring-blue-100 font-medium"
                            value={config.slug}
                            onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            placeholder="dr-your-name"
                        />
                    </div>
                    {config.slug && (
                        <div className="mt-4 flex flex-row items-center gap-4">
                            <button type="button" className="btn-secondary text-xs py-2 px-3 flex items-center gap-2" onClick={copyLink}>
                                <FiCopy /> Copy Link
                            </button>
                            <a
                                href={`${window.location.origin}/doctor/${config.slug}`}
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

            {/* Visuals */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Visual Customization</h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Theme Color</label>
                    <div className="flex gap-4 items-center">
                        <input
                            type="color"
                            value={config.themeColor}
                            onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                            className="h-10 w-20 p-0 border-0 rounded cursor-pointer"
                        />
                        <span className="text-sm font-mono text-slate-500">{config.themeColor}</span>
                        {config.themeColor !== "#007ACC" && (
                            <button
                                type="button"
                                onClick={() => setConfig({ ...config, themeColor: "#007ACC" })}
                                className="text-xs text-slate-500 hover:text-red-500 underline"
                            >
                                Reset to Default
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">This color will be applied to your specific pages and dashboard when you are logged in.</p>
                </div>

                {/* Content Settings */}
                <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Content Display</h4>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Show Chamber Details</label>
                                <p className="text-xs text-slate-500">Display your chamber address and visiting hours.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.showChamber}
                                    onChange={(e) => setConfig({ ...config, showChamber: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007ACC]"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Top Affiliation</label>
                            <p className="text-xs text-slate-500 mb-2">Select the affiliation to display after your designation.</p>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                                value={config.topAffiliation || ""}
                                onChange={(e) => setConfig({ ...config, topAffiliation: e.target.value })}
                            >
                                <option value="">-- Select Affiliation --</option>
                                {affiliations.map((aff, idx) => {
                                    // Robustly access english or first available title
                                    const title = aff.title?.en || (typeof aff.title === 'string' ? aff.title : "");
                                    const inst = aff.institute?.en || (typeof aff.institute === 'string' ? aff.institute : "");
                                    const label = title ? `${title}${inst ? `, ${inst}` : ''}` : `Affiliation ${idx + 1}`;
                                    return (
                                        <option key={idx} value={label}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Profile Pic */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Profile Picture</label>
                    <div className="flex gap-4 items-start">
                        {config.profileImageDetails ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                                <img src={config.profileImageDetails} alt="Profile" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this photo?")) {
                                            setLoading(true); // Reuse loading state for UI feedback
                                            try {
                                                const { deleteFile } = await import("@/lib/s3");
                                                await deleteFile(config.profileImageDetails);
                                                setConfig({ ...config, profileImageDetails: "" });
                                            } catch (e) {
                                                console.error(e);
                                                alert("Failed to delete file from storage, but removed from profile.");
                                                setConfig({ ...config, profileImageDetails: "" });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:text-red-700 transition"
                                    title="Delete Photo"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 border-dashed relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-[#007ACC] border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                                <FiImage size={24} />
                            </div>
                        )}

                        <div className="flex-1">
                            <label className={clsx("btn-secondary inline-flex items-center gap-2 cursor-pointer mb-2", loading && "opacity-50 pointer-events-none")}>
                                <FiUpload /> {loading ? "Uploading..." : "Upload New Picture"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={loading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Basic validation
                                        if (file.size > 1 * 1024 * 1024) {
                                            alert("File too large. Max 1MB.");
                                            e.target.value = ""; // Reset input
                                            return;
                                        }

                                        setLoading(true); // Show loading indicator

                                        // Delete existing if present
                                        if (config.profileImageDetails) {
                                            try {
                                                const { deleteFile } = await import("@/lib/s3");
                                                await deleteFile(config.profileImageDetails);
                                            } catch (err) {
                                                console.warn("Failed to delete old file:", err);
                                            }
                                        }

                                        const formData = new FormData();
                                        formData.append("file", file);

                                        try {
                                            const { uploadFile } = await import("@/lib/s3");
                                            const res = await uploadFile(formData);
                                            if (res.url) {
                                                setConfig(prev => ({ ...prev, profileImageDetails: res.url! }));
                                            } else {
                                                alert("Upload failed: " + res.error);
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert("Upload failed.");
                                        } finally {
                                            setLoading(false);
                                            e.target.value = ""; // Reset input to allow re-uploading same file if needed
                                        }
                                    }}
                                />
                            </label>
                            <p className="text-xs text-slate-500">Supported formats: JPG, PNG. Max size: 5MB.</p>

                            <div className="mt-2">
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">OR PASTE URL</span>
                                <input
                                    type="text"
                                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="https://example.com/my-photo.jpg"
                                    value={config.profileImageDetails}
                                    onChange={(e) => setConfig({ ...config, profileImageDetails: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Booking Contact Numbers</h3>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="showAssistants"
                        checked={config.showAssistantNumbers}
                        onChange={(e) => setConfig({ ...config, showAssistantNumbers: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="showAssistants" className="text-sm text-slate-700">Display assistant phone numbers automatically</label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Additional Booking Numbers</label>
                    {config.bookingNumbers.map((num, idx) => (
                        <input
                            key={idx}
                            type="text"
                            placeholder="+880..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
                            value={num}
                            onChange={(e) => updateNumber(idx, e.target.value)}
                        />
                    ))}
                    <button type="button" onClick={addNumber} className="text-sm text-[#007ACC] hover:underline font-medium">
                        + Add another number
                    </button>
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
