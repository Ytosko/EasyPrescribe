"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, query, limitToLast, orderByChild } from "firebase/database";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import { clsx } from "clsx";

interface Patient {
    name: string;
    phone: string;
    age?: string;
    sex?: string;
    address?: string;
    lastVisit?: number;
    nextVisit?: number;
}

export default function RecentPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const db = getDatabase(app);

                // Fetch Settings
                const settingsSnap = await get(ref(db, `users/${u.uid}/appointmentSettings`));
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.val());
                }

                // Fetch Recent Patients (Last 30 by lastVisit)
                await loadRecentPatients(u.uid);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadRecentPatients = async (userId: string) => {
        const db = getDatabase(app);

        // Query ordered by lastVisit, limit to last 30
        const recentPatientsQuery = query(
            ref(db, `users/${userId}/patients`),
            orderByChild('lastVisit'),
            limitToLast(30)
        );

        const snapshot = await get(recentPatientsQuery);

        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert to array
            const loadedPatients = Object.entries(data).map(([phone, patientData]: [string, any]) => ({
                ...patientData,
                phone
            }));

            // Filter out those without lastVisit if necessary, but query handles ordering
            // Since limitToLast returns ascending order (oldest -> newest), we need to reverse it to show newest first.
            loadedPatients.sort((a: any, b: any) => (b.lastVisit || 0) - (a.lastVisit || 0));

            setPatients(loadedPatients);
        } else {
            setPatients([]);
        }
    };

    const formatDate = (ts?: number | string) => {
        if (!ts || ts === 'N/A') return "-";
        if (typeof ts === 'string') return ts;
        return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    );

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Recent Patients</h1>
                    <p className="text-slate-500">Last 30 patients who visited ({patients.length} total)</p>
                </div>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search recent..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Patient Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Phone</th>
                            {settings?.requiredFields?.age !== false && <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Age/Sex</th>}
                            {settings?.requiredFields?.address !== false && <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Address</th>}
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Last Visit</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Next Visit</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPatients.map((p) => (
                            <tr key={p.phone} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{p.name}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{p.phone}</td>
                                {settings?.requiredFields?.age !== false && (
                                    <td className="px-6 py-4 text-slate-600">
                                        {p.age ? `${p.age}y` : '-'}
                                        {p.sex && <span className="text-slate-400 mx-1">|</span>}
                                        {p.sex}
                                    </td>
                                )}
                                {settings?.requiredFields?.address !== false && (
                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={p.address}>{p.address || '-'}</td>
                                )}
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                        {formatDate(p.lastVisit)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {p.nextVisit ? (
                                        <div className="flex items-center gap-2 text-green-600 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            {formatDate(p.nextVisit)}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">None scheduled</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Link
                                        href={`/dashboard/patients/${p.phone}`}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-[#007ACC] hover:bg-[#007ACC] hover:text-white transition-colors"
                                        title="View Patient Details"
                                    >
                                        <FiArrowRight />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    {search ? `No recent patients found matching "${search}"` : "No recent patients found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
