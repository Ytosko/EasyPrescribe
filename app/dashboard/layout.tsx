"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-all duration-300">
                {children}
            </main>
            <OnboardingModal />
        </div>
    );
}
