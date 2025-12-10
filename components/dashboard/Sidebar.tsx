"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clsx } from "clsx";
import { FiHome, FiUsers, FiCalendar, FiUser, FiSettings, FiLogOut, FiActivity, FiBriefcase, FiEdit3, FiClock } from "react-icons/fi";
import EasyPrescribeLogo from "@/components/ui/Logo";

const menuItems = [
    { name: "Overview", href: "/dashboard", icon: FiHome },
    { name: "My Info", href: "/dashboard/settings", icon: FiEdit3 },
    { name: "Patients", href: "/dashboard/patients", icon: FiUsers },
    { name: "Recent Patients", href: "/dashboard/recent-patients", icon: FiClock },
    { name: "Schedules", href: "/dashboard/schedules", icon: FiCalendar },
    { name: "Prescription", href: "/dashboard/prescription", icon: FiActivity },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/');
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 hidden md:flex flex-col z-40">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2 font-bold text-primary text-xl">
                    <EasyPrescribeLogo className="w-8 h-8" />
                    Easy Prescribe
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
                                        isActive
                                            ? "bg-blue-50 text-primary"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={20} className={isActive ? "text-primary" : "text-slate-400"} />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-100 flex flex-col gap-1">
                <Link
                    href="/dashboard/profile"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        pathname.startsWith("/dashboard/profile")
                            ? "bg-blue-50 text-primary"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    <FiUser size={20} className={pathname.startsWith("/dashboard/profile") ? "text-primary" : "text-slate-400"} />
                    Profile Overview
                </Link>
                <Link
                    href="/dashboard/admin"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        pathname.startsWith("/dashboard/admin")
                            ? "bg-blue-50 text-primary"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    <FiBriefcase size={20} className={pathname === "/dashboard/admin" ? "text-primary" : "text-slate-400"} />
                    Admin Tools
                </Link>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <FiLogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
