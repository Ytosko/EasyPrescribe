"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, query, limitToFirst, orderByKey } from "firebase/database";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { FiSearch, FiUser, FiCalendar, FiArrowRight } from "react-icons/fi";
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

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const db = getDatabase(app);

                // Fetch Settings
                const settingsSnap = await get(ref(db, `users/${u.uid}/appointmentSettings`));
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.val());
                }

                // Fetch Patients - Only load what we need
                await loadPatients(u.uid);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadPatients = async (userId: string) => {
        const db = getDatabase(app);

        // Fetch all patients (needed for search/filter)
        const patientsSnap = await get(ref(db, `users/${userId}/patients`));

        if (patientsSnap.exists()) {
            const patientsData = patientsSnap.val();

            // Get all appointments to find most recent for each patient
            const appointmentsSnap = await get(ref(db, `users/${userId}/appointments`));
            const appointmentsData = appointmentsSnap.exists() ? appointmentsSnap.val() : {};

            // Process patients and auto-populate nextVisit from most recent appointment
            const processedPatients = await Promise.all(
                Object.entries(patientsData).map(async ([phone, patientData]: [string, any]) => {
                    const patient = { ...patientData, phone };

                    // If lastVisit is null/N/A, find most recent appointment
                    if (!patient.lastVisit || patient.lastVisit === 'N/A' || patient.lastVisit === null) {
                        const mostRecentAppointment = findMostRecentAppointment(phone, appointmentsData);
                        if (mostRecentAppointment) {
                            patient.nextVisit = mostRecentAppointment;
                        }
                    }

                    return patient;
                })
            );

            // Sort by name
            processedPatients.sort((a, b) => a.name.localeCompare(b.name));
            setPatients(processedPatients);
        }
    };

    const findMostRecentAppointment = (phone: string, appointmentsData: any): number | null => {
        let mostRecent: number | null = null;

        // Iterate through all dates
        Object.entries(appointmentsData).forEach(([dateStr, dayAppointments]: [string, any]) => {
            if (!dayAppointments) return;

            // Check if this patient has appointment on this date
            const hasAppointment = Object.values(dayAppointments).some((appt: any) => appt.phone === phone);

            if (hasAppointment) {
                const appointmentTimestamp = new Date(dateStr).getTime();
                if (!mostRecent || appointmentTimestamp > mostRecent) {
                    mostRecent = appointmentTimestamp;
                }
            }
        });

        return mostRecent;
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const paginatedPatients = filteredPatients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const formatDate = (ts?: number | string) => {
        if (!ts || ts === 'N/A') return "-";
        if (typeof ts === 'string') return ts;
        return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
                    <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
                    <p className="text-slate-500">Manage your patient records ({patients.length} total)</p>
                </div>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
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
                        {paginatedPatients.map((p, idx) => (
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
                        {paginatedPatients.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    {search ? `No patients found matching "${search}"` : "No patients yet."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
                    <div className="flex justify-between items-center text-sm text-slate-600">
                        <div>
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={clsx(
                                                "w-10 h-10 rounded-lg text-sm font-medium transition",
                                                currentPage === pageNum
                                                    ? "bg-[#007ACC] text-white"
                                                    : "text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
