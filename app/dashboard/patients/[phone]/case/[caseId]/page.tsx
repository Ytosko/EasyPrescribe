"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, push, set } from "firebase/database";
import { app } from "@/lib/firebase";
import { FiArrowLeft, FiPlus, FiFileText, FiClock, FiTrash2, FiFolder, FiSave } from "react-icons/fi";
import Link from "next/link";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
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

            setRecords(prev => [{ id: newRecordRef.key as string, ...newRecord }, ...prev]);

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
                                <FiPlus /> Add Record
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Type Selector / Inline Editor */}
            {isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 ring-4 ring-blue-50/50 animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => setRecordType('prescription')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${recordType === 'prescription' ? 'bg-white text-[#007ACC] border-t-2 border-t-[#007ACC] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <span>💊</span> Prescription
                        </button>
                        <button
                            onClick={() => setRecordType('note')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${recordType === 'note' ? 'bg-white text-[#007ACC] border-t-2 border-t-[#007ACC] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <span>📝</span> Clinical Note
                        </button>
                    </div>

                    <div className="p-6 space-y-4">

                        {/* Prescription Specific UI */}
                        {recordType === 'prescription' ? (
                            <div className="min-h-[500px] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <PrescriptionModal
                                    isOpen={true} // Always match "open" since we are in the flow
                                    onClose={() => setIsCreating(false)}
                                    onSave={handleSaveRecord}
                                    user={user}
                                    patientPhone={phone}
                                    patientData={patientData}
                                    className="h-full"
                                />
                            </div>
                        ) : (
                            // Generic Editor for Notes
                            <div className="h-80 pb-12">
                                <ReactQuill
                                    theme="snow"
                                    value={recordContent}
                                    onChange={setRecordContent}
                                    className="h-full bg-white"
                                    placeholder="Type your clinical notes here..."
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition" disabled={saving}>Cancel</button>
                            {recordType !== 'prescription' && (
                                <button onClick={() => handleSaveRecord()} disabled={saving || !recordContent.trim()} className="px-6 py-2 bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {saving ? <span className="animate-spin">⌛</span> : <FiSave />}
                                    Save Note
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Records List ... */}
            <div className="space-y-6">
                {records.length === 0 ? (
                    <div className="text-center py-12 text-slate-400"><p>No records in this case yet.</p></div>
                ) : (
                    records.map((rec) => (
                        <div key={rec.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`px-6 py-3 border-b flex justify-between items-center ${rec.type === 'prescription' ? 'bg-green-50/50 border-green-100' : rec.type === 'lab' ? 'bg-purple-50/50 border-purple-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{rec.type === 'prescription' ? '💊' : rec.type === 'lab' ? '🔬' : '📝'}</span>
                                    <span className={`font-bold uppercase tracking-wide text-xs ${rec.type === 'prescription' ? 'text-green-700' : rec.type === 'lab' ? 'text-purple-700' : 'text-blue-700'}`}>{rec.type}</span>
                                    <span className="text-slate-400 text-sm flex items-center gap-1">• <FiClock size={12} /> {new Date(rec.date).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-6 prose prose-sm max-w-none text-slate-700">
                                {renderRecordContent(rec)}
                            </div>
                        </div>
                    ))
                )}
            </div>


        </div>
    );
}
