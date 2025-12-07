"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, push, set } from "firebase/database";
import { app } from "@/lib/firebase";
import { FiArrowLeft, FiPlus, FiFileText, FiClock, FiTrash2, FiEdit2, FiFolder } from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

// Dynamically import editor
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface CaseInfo {
    title: string;
    details: string;
    createdAt: number;
}

interface Record {
    id: string;
    date: number;
    type: 'prescription' | 'note' | 'lab';
    content: string;
}

export default function CaseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const phone = params.phone as string;
    const caseId = params.caseId as string;

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
    const [records, setRecords] = useState<Record[]>([]);

    // Create Record State
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [recordType, setRecordType] = useState<'prescription' | 'note' | 'lab'>('prescription');
    const [recordContent, setRecordContent] = useState("");

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
    }, [phone, caseId]);

    const loadData = async (userId: string) => {
        setLoading(true);
        const db = getDatabase(app);

        try {
            // Fetch Case Info
            const caseSnap = await get(ref(db, `users/${userId}/cases/${phone}/${caseId}`));
            if (caseSnap.exists()) {
                setCaseInfo(caseSnap.val());
            } else {
                console.error("Case not found");
            }

            // Fetch Records
            const recordsSnap = await get(ref(db, `users/${userId}/cases/${phone}/${caseId}/records`));
            if (recordsSnap.exists()) {
                const recordsData = recordsSnap.val();
                const recordsList = Object.entries(recordsData).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value
                }));
                // Sort by date descending
                recordsList.sort((a, b) => b.date - a.date);
                setRecords(recordsList);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewRecordClick = async () => {
        if (!user) return;

        try {
            const db = getDatabase(app);
            const settingsSnap = await get(ref(db, `users/${user.uid}/settings/prescription`));

            if (!settingsSnap.exists()) {
                Swal.fire({
                    title: "Configuration Required",
                    text: "You haven't set up your prescription template yet. Please configure it to proceed.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#007ACC",
                    confirmButtonText: "Configure Now"
                }).then((result) => {
                    if (result.isConfirmed) {
                        router.push("/dashboard/prescription");
                    }
                });
                return;
            }

            setIsCreating(true);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to check configuration.", "error");
        }
    };

    const handleSaveRecord = async () => {
        if (!user || !recordContent.trim()) return;
        setSaving(true);

        try {
            const db = getDatabase(app);
            const newRecordRef = push(ref(db, `users/${user.uid}/cases/${phone}/${caseId}/records`));

            const newRecord = {
                date: Date.now(),
                type: recordType,
                content: recordContent
            };

            await set(newRecordRef, newRecord);

            setRecords(prev => [{ id: newRecordRef.key as string, ...newRecord }, ...prev]);
            setIsCreating(false);
            setRecordContent("");
            setRecordType("prescription");

            Swal.fire({
                title: "Saved!",
                text: "Record added successfully",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save record", "error");
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

    if (!caseInfo) {
        return (
            <div className="p-8 text-center text-slate-500">
                Case not found. <Link href={`/dashboard/patients/${phone}`} className="text-[#007ACC] hover:underline">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href={`/dashboard/patients/${phone}`} className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1 w-fit">
                    <FiArrowLeft /> Back to Patient
                </Link>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center text-2xl">
                            <FiFolder />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-800">{caseInfo.title}</h1>
                            {caseInfo.details && <p className="text-slate-600 mt-2">{caseInfo.details}</p>}
                            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <FiClock size={12} /> Created: {new Date(caseInfo.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <button
                            onClick={handleNewRecordClick}
                            className="bg-[#007ACC] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 font-medium"
                        >
                            <FiPlus /> Add Record
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 ring-4 ring-blue-50/50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiFileText className="text-[#007ACC]" /> New Entry
                    </h3>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={recordType === 'prescription'}
                                    onChange={() => setRecordType('prescription')}
                                    className="text-[#007ACC] focus:ring-[#007ACC]"
                                />
                                <span className="font-medium text-slate-700">💊 Prescription</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={recordType === 'note'}
                                    onChange={() => setRecordType('note')}
                                    className="text-[#007ACC] focus:ring-[#007ACC]"
                                />
                                <span className="font-medium text-slate-700">📝 Clinical Note</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={recordType === 'lab'}
                                    onChange={() => setRecordType('lab')}
                                    className="text-[#007ACC] focus:ring-[#007ACC]"
                                />
                                <span className="font-medium text-slate-700">🔬 Lab Report</span>
                            </label>
                        </div>

                        <div className="h-96 pb-12">
                            <ReactQuill
                                theme="snow"
                                value={recordContent}
                                onChange={setRecordContent}
                                className="h-full"
                                placeholder="Type your notes, prescription details, or report findings here..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRecord}
                                disabled={saving || !recordContent.trim()}
                                className="px-6 py-2 bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? <span className="animate-spin">⌛</span> : <FiPlus />}
                                Save Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Records List */}
            <div className="space-y-6">
                {records.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p>No records in this case yet.</p>
                    </div>
                ) : (
                    records.map((rec) => (
                        <div key={rec.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`px-6 py-3 border-b flex justify-between items-center
                                ${rec.type === 'prescription' ? 'bg-green-50/50 border-green-100' :
                                    rec.type === 'lab' ? 'bg-purple-50/50 border-purple-100' :
                                        'bg-blue-50/50 border-blue-100'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">
                                        {rec.type === 'prescription' ? '💊' : rec.type === 'lab' ? '🔬' : '📝'}
                                    </span>
                                    <span className={`font-bold uppercase tracking-wide text-xs
                                        ${rec.type === 'prescription' ? 'text-green-700' :
                                            rec.type === 'lab' ? 'text-purple-700' :
                                                'text-blue-700'}`}>
                                        {rec.type}
                                    </span>
                                    <span className="text-slate-400 text-sm flex items-center gap-1">
                                        • <FiClock size={12} /> {new Date(rec.date).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 prose prose-sm max-w-none text-slate-700">
                                <div dangerouslySetInnerHTML={{ __html: rec.content }} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
