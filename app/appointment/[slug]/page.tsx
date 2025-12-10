"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDatabase, ref, get } from "firebase/database";
import { FiLock, FiUser, FiCalendar } from "react-icons/fi";
import { MaterialInput } from "@/components/ui/MaterialInput";

export default function AssistantLogin() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [doctorName, setDoctorName] = useState("");

    useEffect(() => {
        // Verify slug exists and get doctor info (optional, just for UI niceness)
        const checkSlug = async () => {
            if (!slug) return;

            // Immediate Validation
            if (!/^[a-z0-9-]+$/.test(slug)) {
                setError("Invalid portal address.");
                return;
            }

            const db = getDatabase();
            const slugRef = ref(db, `appointment_slugs/${slug}`);
            const snapshot = await get(slugRef);

            if (!snapshot.exists()) {
                setError("Invalid appointment portal.");
            }
        };
        checkSlug();
    }, [slug]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const db = getDatabase();
            // 1. Get Doctor UID from slug
            const slugSnapshot = await get(ref(db, `appointment_slugs/${slug}`));
            if (!slugSnapshot.exists()) {
                throw new Error("Portal not found.");
            }
            const doctorUid = slugSnapshot.val();

            // 2. Check Activation Status
            const settingsSnapshot = await get(ref(db, `users/${doctorUid}/appointmentSettings`));
            if (settingsSnapshot.exists()) {
                const settings = settingsSnapshot.val();
                if (settings.isActive === false) { // Explicit check for false to support legacy valid data
                    // We can't use server-side notFound() easily in client component async effect without layout hacks
                    // But we can redirect or show error
                    // Actually `notFound()` works in client components in Next 13+ usually triggers error boundary
                    // But strictly, let's just setError or router.replace('/404')
                    // Let's use router for safety in this client-side logic
                    router.replace('/404');
                    return;
                }
            }

            // 3. Check credentials against doctor's assistants
            const assistantsFn = ref(db, `users/${doctorUid}/assistants`);
            const assistantsSnapshot = await get(assistantsFn);

            if (!assistantsSnapshot.exists()) {
                throw new Error("Invalid credentials.");
            }

            const assistants = assistantsSnapshot.val();
            let foundAssistant = null;

            Object.entries(assistants).forEach(([key, val]: [string, any]) => {
                if (val.username === username && val.password === password) {
                    foundAssistant = { id: key, ...val, doctorUid };
                }
            });

            if (foundAssistant) {
                // Success! Save session (localStorage for simplicity as per MVP)
                localStorage.setItem("assistant_session", JSON.stringify(foundAssistant));
                router.push(`/appointment/${slug}/dashboard`);
            } else {
                throw new Error("Invalid username or password.");
            }

        } catch (err: any) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!slug) return <div>Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-[#007ACC] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCalendar size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Assistant Portal</h1>
                    <p className="text-slate-500 mt-2">Log in to manage appointments for <span className="font-semibold text-slate-700">{slug}</span></p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <MaterialInput
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            icon={<FiUser size={20} />}
                        />
                        <MaterialInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            icon={<FiLock size={20} />}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!error}
                        className="btn-primary w-full py-3 text-lg"
                    >
                        {loading ? "Logging in..." : "Login to Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
}
