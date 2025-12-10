"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, push, set, update, runTransaction } from "firebase/database";
import { app } from "@/lib/firebase";
import { FiArrowLeft, FiPlus, FiFileText, FiClock, FiTrash2, FiFolder, FiSave } from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
// import printJS from "print-js"; // Dynamically imported cleanly
import PrescriptionModal from "@/components/prescription/PrescriptionModal";
import PrescriptionViewer from "@/components/prescription/PrescriptionViewer";

// Dynamically import editor
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface CaseRecord {
    id: string;
    type: 'prescription' | 'note' | 'lab';
    content: string;
    date: number;
}

export default function CaseDetailsPage() {
    const params = useParams();
    const phone = params.phone as string;
    const caseId = params.caseId as string;
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [caseInfo, setCaseInfo] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);

    const [isCreating, setIsCreating] = useState(false);
    const [recordType, setRecordType] = useState<'prescription' | 'note'>('prescription');
    const [recordContent, setRecordContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (u) {
                setUser(u);
                fetchCaseDetails(u.uid);
                fetchPatientProfile(u.uid);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchPatientProfile = async (uid: string) => {
        try {
            const db = getDatabase(app);
            const patSnap = await get(ref(db, `users/${uid}/patients/${phone}`));
            if (patSnap.exists()) {
                setPatientData(patSnap.val());
            }
        } catch (error) {
            console.error("Error fetching patient profile:", error);
        }
    };

    const fetchCaseDetails = async (uid: string) => {
        try {
            const db = getDatabase(app);
            // Fetch Case Info
            const caseRef = ref(db, `users/${uid}/cases/${phone}/${caseId}`);
            const caseSnap = await get(caseRef);

            if (caseSnap.exists()) {
                setCaseInfo(caseSnap.val());

                // Fetch Records
                const recordsRef = ref(db, `users/${uid}/cases/${phone}/${caseId}/records`);
                const recordsSnap = await get(recordsRef);
                if (recordsSnap.exists()) {
                    const recs = Object.entries(recordsSnap.val()).map(([key, val]: [string, any]) => ({
                        id: key,
                        ...val
                    }));
                    // Sort by date desc
                    recs.sort((a, b) => b.date - a.date);
                    setRecords(recs);
                }
            } else {
                setCaseInfo(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const showConfigAlert = () => {
        Swal.fire({
            title: "Configuration Missing",
            text: "You haven't set up your prescription layout yet.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#007ACC",
            confirmButtonText: "Go to Settings",
            cancelButtonText: "Later"
        }).then((result) => {
            if (result.isConfirmed) {
                router.push("/dashboard/prescription");
            }
        });
    };

    const handleNewRecordClick = async () => {
        if (!user) return;

        try {
            // Check for config logic (kept same, but maybe slightly relaxed if modal handles it?)
            // The modal handles config selection, but we still want to ensure they have at least one?
            // Actually, the previous check was ensuring a DEFAULT exists. 
            // The modal requires configs to exist to populate the dropdown.
            // Let's keep the check but redirect to modal instead of generic editor.

            const db = getDatabase(app);
            const settingsSnap = await get(ref(db, `users/${user.uid}/settings/prescription`));

            if (!settingsSnap.exists()) {
                showConfigAlert();
                return;
            }

            const settings = settingsSnap.val();
            // We just need ANY config to be present basically, or at least the ability to create one?
            // If they have no configs, the modal config dropdown will be empty.
            // Let's assume the previous check is good enough.
            const hasConfig = settings.defaultId || (settings.template && settings.data);

            if (!hasConfig) {
                showConfigAlert();
                return;
            }

            // Valid config -> Open Selection Modal or specific type directly?
            // Usage flow: User clicks "Add Record" -> chooses type? 
            // Original UI: Click "Add Record" -> Inline generic editor appears -> Choose radio button.
            // New Plan: "Add Record" -> Show Inline Editor (Default Note) OR Modal?
            // Let's keep the "Inline Editor" container, but inside it, if "Prescription" is selected, 
            // show a button "Open Prescription Designer" or just launch the modal immediately?
            // "Render PrescriptionModal when isCreating is true and type is 'prescription'" - from plan.

            setIsCreating(true);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to check configuration.", "error");
        }
    };

    const handleSaveRecord = async (data?: any) => {
        // If data is passed, it's from the Modal (Prescription JSON). 
        // If not, it's from the generic editor (recordContent string).

        let contentToSave = recordContent;
        let typeToSave = recordType;

        if (data) {
            contentToSave = JSON.stringify(data);
            typeToSave = 'prescription';
        } else {
            if (!user || !recordContent.trim()) return;
        }

        setSaving(true);

        try {
            const db = getDatabase(app);
            const newRecordRef = push(ref(db, `users/${user.uid}/cases/${phone}/${caseId}/records`));

            const newRecord = {
                date: Date.now(),
                type: typeToSave,
                content: contentToSave
            };

            await set(newRecordRef, newRecord);

            await set(newRecordRef, newRecord);

            setRecords(prev => [{ id: newRecordRef.key as string, ...newRecord }, ...prev]);

            // Update Patient Visit Dates if new prescription
            if (typeToSave === 'prescription' && data?.nextVisit) {
                const now = Date.now();
                let nextVisitMs = now;
                const { amount, unit } = data.nextVisit;

                if (amount > 0) {
                    if (unit === 'Days') nextVisitMs += amount * 24 * 60 * 60 * 1000;
                    else if (unit === 'Weeks') nextVisitMs += amount * 7 * 24 * 60 * 60 * 1000;
                    else if (unit === 'Months') nextVisitMs += amount * 30 * 24 * 60 * 60 * 1000;
                } else {
                    nextVisitMs = 0; // No next visit or continued? Let's just keep it 0 or ignore.
                    // Actually let's assume if amount is 0, we don't set a specific next visit date?
                    // Or just set to now?
                    // Let's rely on valid input from modal which defaults to 7 days.
                }

                if (nextVisitMs > now) {
                    await update(ref(db, `users/${user.uid}/patients/${phone}`), {
                        lastVisit: now,
                        nextVisit: nextVisitMs
                    });
                } else {
                    // Just update last visit
                    await update(ref(db, `users/${user.uid}/patients/${phone}`), {
                        lastVisit: now
                    });
                }
            }

            // Log Activity for Prescription Creation
            if (typeToSave === 'prescription') {
                const activityRef = push(ref(db, `users/${user.uid}/activities`));
                await set(activityRef, {
                    type: 'prescription_created',
                    timestamp: Date.now(),
                    data: {
                        patientName: patientData?.name || 'Unknown',
                        patientPhone: phone,
                        createdBy: user.email,
                        caseId: caseId
                    }
                });

                // Increment Total Prescriptions Count
                const statsRef = ref(db, `users/${user.uid}/stats/prescriptions`);
                await runTransaction(statsRef, (currentCount) => {
                    return (currentCount || 0) + 1;
                });
            }

            // Reset States
            setIsCreating(false);
            setRecordContent("");
            setRecordType("prescription"); // Reset default
            setIsPrescriptionModalOpen(false); // Close modal if open

            Swal.fire({
                title: "Saved!",
                text: "Record added successfully",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save record", "error");
        };

    };

    const renderRecordContent = (rec: any) => {
        if (rec.type === 'prescription') {
            try {
                const data = JSON.parse(rec.content);
                if (data.pdfUrl) {
                    return (
                        <div className="flex flex-col gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 text-red-500 rounded flex items-center justify-center">
                                        <FiFileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">Prescription Generated</p>
                                        <p className="text-xs text-slate-500">{new Date(data.generatedAt || rec.date).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={data.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 transition flex items-center gap-2"
                                    >
                                        Print 🖨️
                                    </a>
                                    <a
                                        href={data.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#007ACC] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition flex items-center gap-2"
                                    >
                                        View PDF ↗
                                    </a>
                                </div>
                            </div>
                            {/* Optional: Show notes or summary if added later */}
                        </div>
                    );
                }
                return <PrescriptionViewer data={data} />;
            } catch (e) {
                return <div dangerouslySetInnerHTML={{ __html: rec.content }} />;
            }
        }
        return <div dangerouslySetInnerHTML={{ __html: rec.content }} />;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div></div>;
    if (!caseInfo) return <div className="p-8 text-center text-slate-500">Case not found.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ... Header (Back link, Title, Add Record Button) ... */}
            <div className="flex flex-col gap-4">
                <Link href={`/dashboard/patients/${phone}`} className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1 w-fit">
                    <FiArrowLeft /> Back to Patient
                </Link>

                {!isCreating && (
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
                                onClick={handleNewRecordClick} // Opens Inline "Type Selector"
                                className="bg-[#007ACC] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 font-medium"
                            >
                                <FiPlus /> New
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Type Selector / Inline Editor */}
            {isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 ring-4 ring-blue-50/50 animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden">
                    <div className="p-0">
                        {/* Prescription Specific UI - No Tabs, Default View */}
                        <div className="min-h-[500px] border-b border-slate-200 overflow-hidden shadow-sm">
                            <PrescriptionModal
                                isOpen={true}
                                onClose={() => setIsCreating(false)}
                                onSave={handleSaveRecord}
                                user={user}
                                patientPhone={phone}
                                patientData={patientData}
                                className="h-full border-none shadow-none rounded-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500">Date & Type</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-slate-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.slice((currentPage - 1) * 20, currentPage * 20).map((rec) => {
                                let pdfUrl = null;
                                let isPrescription = rec.type === 'prescription';

                                if (isPrescription) {
                                    try {
                                        const data = JSON.parse(rec.content);
                                        pdfUrl = data.pdfUrl;
                                    } catch (e) {
                                        // legacy or note
                                    }
                                }

                                return (
                                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${rec.type === 'prescription' ? 'bg-green-100 text-green-600' :
                                                    rec.type === 'lab' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {rec.type === 'prescription' ? '💊' : rec.type === 'lab' ? '🔬' : '📝'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {rec.type === 'prescription' ? 'Prescription' : rec.type === 'lab' ? 'Lab Report' : 'Clinical Note'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        {new Date(rec.date).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {pdfUrl ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            const printJS = (await import("print-js")).default;
                                                            printJS(pdfUrl);
                                                        }}
                                                        className="bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                                                    >
                                                        🖨️ Print
                                                    </button>
                                                    <a
                                                        href={pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-[#007ACC] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5"
                                                    >
                                                        PDF ↗
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No actions available</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {records.length > 20 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500">
                            Showing <span className="font-bold">{(currentPage - 1) * 20 + 1}</span> to <span className="font-bold">{Math.min(currentPage * 20, records.length)}</span> of <span className="font-bold">{records.length}</span> results
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(records.length / 20), p + 1))}
                                disabled={currentPage >= Math.ceil(records.length / 20)}
                                className="px-3 py-1 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}
