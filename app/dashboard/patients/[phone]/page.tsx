"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, push, set } from "firebase/database";
import { app } from "@/lib/firebase";
import { FiUser, FiPhone, FiPlus, FiFolder, FiArrowLeft, FiClock, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import Swal from "sweetalert2";

interface Patient {
    name: string;
    phone: string;
    age?: string;
    sex?: string;
    address?: string;
}

interface Case {
    id: string;
    createdAt: number;
    title: string;
    details?: string;
}

export default function PatientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const phone = params.phone as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    // New Case Form State
    const [newCaseTitle, setNewCaseTitle] = useState("");
    const [newCaseDetails, setNewCaseDetails] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                await loadData(u.uid);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [phone]);

    const loadData = async (userId: string) => {
        setLoading(true);
        const db = getDatabase(app);

        try {
            // Fetch Patient Info
            const patientSnap = await get(ref(db, `users/${userId}/patients/${phone}`));
            if (patientSnap.exists()) {
                setPatient({ ...patientSnap.val(), phone });
            }

            // Fetch Cases
            const casesSnap = await get(ref(db, `users/${userId}/cases/${phone}`));
            if (casesSnap.exists()) {
                const casesData = casesSnap.val();
                const casesList = Object.entries(casesData).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value
                }));
                // Sort by date descending
                casesList.sort((a, b) => b.createdAt - a.createdAt);
                setCases(casesList);
            } else {
                setCases([]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCase = async () => {
        if (!newCaseTitle.trim() || !user) return;

        setSaving(true);
        const db = getDatabase(app);
        const newCaseRef = push(ref(db, `users/${user.uid}/cases/${phone}`));

        const newCase = {
            createdAt: Date.now(),
            title: newCaseTitle,
            details: newCaseDetails,
        };

        try {
            await set(newCaseRef, newCase);
            setCases(prev => [{ id: newCaseRef.key as string, ...newCase } as any, ...prev]);
            setIsCreating(false);
            setNewCaseTitle("");
            setNewCaseDetails("");
            Swal.fire({
                title: "Success!",
                text: "Case Created",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error("Error creating case:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to create case. Please try again.",
                icon: "error",
                confirmButtonColor: "#007ACC"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Patient not found.</p>
                <Link href="/dashboard/patients" className="text-[#007ACC] hover:underline mt-2 inline-block">Go back to Patients</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 text-slate-500 mb-4">
                <Link href="/dashboard/patients" className="hover:text-slate-800 transition flex items-center gap-1">
                    <FiArrowLeft /> Back to Patients
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-medium">{patient.name}</span>
            </div>

            {/* Patient Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#007ACC] flex items-center justify-center text-2xl">
                            <FiUser />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 mt-1 text-sm">
                                <div className="flex items-center gap-1">
                                    <FiPhone className="text-slate-400" />
                                    <span className="font-mono">{patient.phone}</span>
                                </div>
                                {(patient.age || patient.sex) && (
                                    <div className="flex items-center gap-1">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-xs font-medium">
                                            {patient.age ? `${patient.age}y` : ''}
                                            {patient.age && patient.sex ? ' / ' : ''}
                                            {patient.sex}
                                        </span>
                                    </div>
                                )}
                                {patient.address && (
                                    <div className="flex items-center gap-1 max-w-md truncate" title={patient.address}>
                                        <span className="text-slate-400">📍</span>
                                        {patient.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-[#007ACC] text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition shadow-sm font-medium"
                    >
                        <FiPlus /> New Case Folder
                    </button>
                </div>
            </div>

            {/* Create Case Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 ring-4 ring-blue-50/50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiFolder className="text-[#007ACC]" /> Create New Case Folder
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Case Title</label>
                            <input
                                type="text"
                                value={newCaseTitle}
                                onChange={(e) => setNewCaseTitle(e.target.value)}
                                placeholder="e.g., Fever Strategy, Long term diabetes care"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Short Description / Details</label>
                            <textarea
                                value={newCaseDetails}
                                onChange={(e) => setNewCaseDetails(e.target.value)}
                                placeholder="Optional description..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none h-24 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCase}
                                disabled={saving || !newCaseTitle.trim()}
                                className="px-6 py-2 bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? <span className="animate-spin">⌛</span> : <FiPlus />}
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cases Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FiFolder className="text-slate-400" /> Case Folders
                </h3>

                {cases.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FiFolder size={24} />
                        </div>
                        <p className="font-medium">No cases found</p>
                        <p className="text-sm mt-1">Create a new case folder to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cases.map((c) => (
                            <Link
                                href={`/dashboard/patients/${phone}/case/${c.id}`}
                                key={c.id}
                                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition group block relative overflow-hidden"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-2xl group-hover:bg-amber-100 transition">
                                        <FiFolder />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate group-hover:text-[#007ACC] transition">{c.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <FiClock size={12} />
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </p>
                                        {c.details && (
                                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{c.details}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-[#007ACC] group-hover:translate-x-1 transition">
                                    <FiArrowRight />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
