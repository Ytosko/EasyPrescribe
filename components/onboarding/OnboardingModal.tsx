"use client";

import { useAuth } from "@/context/AuthContext";
import { ProfileForm, ProfileData } from "./ProfileForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(true);

    useEffect(() => {
        async function checkProfile() {
            if (!user) return;
            try {
                const { ref, get } = await import("firebase/database");
                const { database } = await import("@/lib/firebase");
                const snapshot = await get(ref(database, `users/${user.uid}/profile`));

                if (!snapshot.exists() || !snapshot.val().onboardingCompleted) {
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error checking profile:", error);
            } finally {
                setCheckLoading(false);
            }
        }
        checkProfile();
    }, [user]);

    const handleSubmit = async (data: ProfileData) => {
        if (!user) return;
        setLoading(true);
        try {
            const { ref, set } = await import("firebase/database");
            const { database } = await import("@/lib/firebase");

            const finalData = { ...data, onboardingCompleted: true };
            await set(ref(database, `users/${user.uid}/profile`), finalData);

            setIsOpen(false);
            // Refresh or just close
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkLoading || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
                <div className="bg-white p-6 border-b border-slate-100 mb-0 rounded-t-xl">
                    <h2 className="text-2xl font-bold text-slate-900">Welcome to Easy Prescribe!</h2>
                    <p className="text-slate-500">Let's set up your professional profile to get started.</p>
                </div>
                <div className="bg-white rounded-b-xl pb-2">
                    <ProfileForm onSubmit={handleSubmit} loading={loading} buttonLabel="Complete Setup" />
                </div>
            </div>
        </div>
    );
}
