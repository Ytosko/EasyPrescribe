"use client";

import { ProfileForm, ProfileData } from "@/components/onboarding/ProfileForm";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function SettingsPage() {
    const { user } = useAuth();
    const [initialData, setInitialData] = useState<ProfileData | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const { ref, get } = await import("firebase/database");
                const { database } = await import("@/lib/firebase");
                const snapshot = await get(ref(database, `users/${user.uid}/profile`));

                if (snapshot.exists()) {
                    setInitialData(snapshot.val());
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const handleSubmit = async (data: ProfileData) => {
        if (!user) return;
        setSaving(true);
        try {
            const { ref, set } = await import("firebase/database");
            const { database } = await import("@/lib/firebase");

            // Settings update retains the onboarding status
            const finalData = { ...data, onboardingCompleted: true };
            await set(ref(database, `users/${user.uid}/profile`), finalData);
            Swal.fire({
                title: "Saved!",
                text: "Settings saved successfully!",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error("Error saving profile:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to save settings.",
                icon: "error",
                confirmButtonColor: "#007ACC"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div></div>;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your profile and chamber details</p>
            </header>

            <ProfileForm
                initialData={initialData}
                onSubmit={handleSubmit}
                loading={saving}
            />
        </div>
    );
}
