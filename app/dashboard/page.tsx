"use client";

import { useAuth } from '@/context/AuthContext';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiActivity, FiPlus, FiUsers, FiUserPlus, FiCalendar } from 'react-icons/fi';
import { getDatabase, ref, get, query, orderByChild, limitToLast, set } from "firebase/database";
import { clsx } from 'clsx';

interface Activity {
    id: string;
    type: 'patient_created' | 'appointment_created' | 'prescription_created';
    timestamp: number;
    data: {
        patientName?: string;
        patientPhone?: string;
        appointmentDate?: string;
        createdBy?: string;
    };
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ patients: 0, prescriptions: 0 });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                const db = getDatabase();

                // Fetch Total Patients
                const patientsRef = ref(db, `users/${user.uid}/patients`);
                const patientsSnap = await get(patientsRef);
                const totalPatients = patientsSnap.exists() ? Object.keys(patientsSnap.val()).length : 0;

                // Fetch Total Prescriptions (Stats)
                const statsRef = ref(db, `users/${user.uid}/stats/prescriptions`);
                const statsSnap = await get(statsRef);

                let totalPrescriptions = statsSnap.exists() ? statsSnap.val() : 0;

                // Auto-Backfill: If stats is 0 (or missing), count from cases
                if (totalPrescriptions === 0) {
                    try {
                        const casesRef = ref(db, `users/${user.uid}/cases`);
                        const casesSnap = await get(casesRef);

                        if (casesSnap.exists()) {
                            let calculatedCount = 0;
                            const cases = casesSnap.val();

                            // Iterate Patients
                            Object.values(cases).forEach((patientCases: any) => {
                                // Iterate Cases
                                Object.values(patientCases).forEach((caseObj: any) => {
                                    if (caseObj && caseObj.records) {
                                        // Count Records with type 'prescription'
                                        Object.values(caseObj.records).forEach((rec: any) => {
                                            if (rec.type === 'prescription') {
                                                calculatedCount++;
                                            }
                                        });
                                    }
                                });
                            });

                            if (calculatedCount > 0) {
                                // Update Stats Database
                                await set(ref(db, `users/${user.uid}/stats/prescriptions`), calculatedCount);
                                totalPrescriptions = calculatedCount;
                                console.log("Backfilled prescription stats:", calculatedCount);
                            }
                        }
                    } catch (err) {
                        console.error("Backfill error:", err);
                    }
                }

                setStats({
                    patients: totalPatients,
                    prescriptions: totalPrescriptions
                });
            }
        };
        fetchStats();
    }, [user]);

    useEffect(() => {
        const fetchActivities = async () => {
            if (user) {
                const db = getDatabase();
                const activitiesRef = ref(db, `users/${user.uid}/activities`);
                const activitiesSnap = await get(activitiesRef);

                if (activitiesSnap.exists()) {
                    const data = activitiesSnap.val();
                    const activityList: Activity[] = Object.entries(data).map(([key, val]: [string, any]) => ({
                        id: key,
                        ...val
                    }));

                    // Sort by timestamp descending (newest first)
                    activityList.sort((a, b) => b.timestamp - a.timestamp);
                    setActivities(activityList);
                } else {
                    setActivities([]);
                }
            }
        };
        fetchActivities();
    }, [user]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/');
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'patient_created':
                return <FiUserPlus className="text-emerald-600" />;
            case 'appointment_created':
                return <FiCalendar className="text-blue-600" />;
            case 'prescription_created':
                return <FiActivity className="text-green-600" />;
            default:
                return <FiActivity className="text-slate-600" />;
        }
    };

    const getActivityText = (activity: Activity) => {
        switch (activity.type) {
            case 'patient_created':
                return (
                    <>
                        <span className="font-semibold text-slate-900">{activity.data.patientName}</span>
                        <span className="text-slate-600"> was added as a new patient</span>
                        {activity.data.createdBy && (
                            <span className="text-slate-400 text-xs ml-2">by {activity.data.createdBy}</span>
                        )}
                    </>
                );
            case 'appointment_created':
                return (
                    <>
                        <span className="text-slate-600">Appointment for </span>
                        <span className="font-semibold text-slate-900">{activity.data.patientName}</span>
                        <span className="text-slate-600"> on </span>
                        <span className="font-medium text-slate-700">
                            {activity.data.appointmentDate && new Date(activity.data.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {activity.data.createdBy && (
                            <span className="text-slate-400 text-xs ml-2">by {activity.data.createdBy}</span>
                        )}
                    </>
                );
            case 'prescription_created':
                return (
                    <>
                        <span className="text-slate-600">Generated prescription for </span>
                        <span className="font-semibold text-slate-900">{activity.data.patientName}</span>
                        {activity.data.createdBy && (
                            <span className="text-slate-400 text-xs ml-2">by {activity.data.createdBy}</span>
                        )}
                    </>
                );
            default:
                return <span className="text-slate-600">Unknown activity</span>;
        }
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div>
        </div>;
    }

    const paginatedActivities = activities.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Overview of your practice</p>
                </div>
                <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    Today: <span className="font-semibold text-slate-900">{new Date().toLocaleDateString()}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Total Patients</h3>
                        <p className="text-3xl font-bold text-slate-900">{stats.patients}</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <FiUsers size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Prescriptions</h3>
                        <p className="text-3xl font-bold text-slate-900">{stats.prescriptions}</p>
                    </div>
                    <div className="p-2 bg-teal-50 text-teal-500 rounded-lg">
                        <FiActivity size={20} />
                    </div>
                </div>

                {/* Action Card Removed as requested */}
                <div className="hidden"></div>
            </div>

            {/* Activity Feed */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {activities.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FiActivity size={32} />
                            </div>
                            <p className="font-medium text-slate-600">No recent activity</p>
                            <p className="text-sm">Activity will appear here as you work.</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-slate-100">
                                {paginatedActivities.map((activity) => (
                                    <div key={activity.id} className="p-4 hover:bg-slate-50 transition flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-relaxed">
                                                {getActivityText(activity)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatTimestamp(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                                    <div className="text-sm text-slate-600">
                                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, activities.length)} of {activities.length} activities
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={clsx(
                                                        "w-10 h-10 rounded-lg text-sm font-medium transition",
                                                        currentPage === page
                                                            ? "bg-[#007ACC] text-white"
                                                            : "text-slate-600 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages}
                                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
