"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, onValue, remove, update, push, set, get, query, orderByKey, startAt, endAt, limitToFirst } from "firebase/database";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { FiCalendar, FiClock, FiTrash2, FiUser, FiPlus, FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";
import { clsx } from "clsx";
import { MaterialInput } from "@/components/ui/MaterialInput";
import Swal from "sweetalert2";

interface Appointment {
    id: string;
    name: string;
    phone: string;
    age?: string;
    sex?: string;
    address?: string;
    order: number;
    createdBy?: string; // "Doctor" or assistant ID
    createdByName?: string; // Helper for display if we have assistant map
}

export default function SchedulesPage() {
    const [date, setDate] = useState<string>("");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Config
    const [settings, setSettings] = useState<any>(null);

    // New Appointment Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", age: "", sex: "Male", address: "" });
    const [searching, setSearching] = useState(false);

    // Suggestions
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isSelectingPatient = useRef(false); // Track if we're selecting a patient

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const d = new Date();
        const stored = localStorage.getItem("doctor_last_managed_date");
        if (stored) setDate(stored);
        else setDate(d.toISOString().split('T')[0]);

        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const db = getDatabase(app);
                get(ref(db, `users/${u.uid}/appointmentSettings`)).then(s => {
                    if (s.exists()) setSettings(s.val());
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (date) localStorage.setItem("doctor_last_managed_date", date);
        if (!user || !date) return;

        const db = getDatabase(app);
        const apptRef = ref(db, `users/${user.uid}/appointments/${date}`);

        const unsubscribe = onValue(apptRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                list.sort((a, b) => a.order - b.order);
                setAppointments(list);
                setCurrentPage(1); // Reset to page 1 when date changes
            } else {
                setAppointments([]);
                setCurrentPage(1);
            }
        });
        return () => unsubscribe();
    }, [date, user]);

    // Patient Lookup by Phone (Suggestions)
    useEffect(() => {
        if (isSelectingPatient.current) {
            // Skip search if we're in the middle of selecting a patient
            isSelectingPatient.current = false;
            return;
        }

        if (!formData.phone || formData.phone.length < 3 || !user) {
            setSuggestions([]);
            setShowSuggestions(false); // Hide popup for short input
            return;
        }

        const timer = setTimeout(async () => {
            const db = getDatabase(app);
            const patientsRef = ref(db, `users/${user.uid}/patients`);

            const q = query(
                patientsRef,
                orderByKey(),
                startAt(formData.phone),
                endAt(formData.phone + "\uf8ff"),
                limitToFirst(10)
            );

            try {
                const snap = await get(q);
                if (snap.exists()) {
                    const allData = Object.values(snap.val());
                    // Client-side filter to ensure only matching phone numbers are shown
                    const filtered = allData
                        .filter((p: any) => p.phone && p.phone.startsWith(formData.phone))
                        .slice(0, 10); // Max 10 results

                    if (filtered.length > 0) {
                        setSuggestions(filtered);
                        setShowSuggestions(true);
                    } else {
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false); // Hide popup when no results
                }
            } catch (e) {
                console.error("Search error", e);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.phone, user]);


    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Delete Appointment?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        });

        if (!result.isConfirmed) return;

        const db = getDatabase(app);
        await remove(ref(db, `users/${user.uid}/appointments/${date}/${id}`));
        Swal.fire("Deleted!", "Your appointment has been deleted.", "success");
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, phone: e.target.value }));
        setShowSuggestions(true);
    };

    const selectPatient = (p: any) => {
        isSelectingPatient.current = true; // Set flag to prevent search
        setFormData(prev => ({
            ...prev,
            name: p.name,
            phone: p.phone,
            age: p.age || "",
            sex: p.sex || "Male",
            address: p.address || ""
        }));
        setShowSuggestions(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const db = getDatabase(app);
        const apptRef = ref(db, `users/${user.uid}/appointments/${date}`);

        // No checks for doctor! Power user.
        const countSnap = await get(apptRef);
        const newOrder = countSnap.exists() ? (Math.max(...Object.values(countSnap.val() as any).map((a: any) => a.order as number)) + 1) : 1;

        // Save Appointment
        const newRef = push(apptRef);
        await set(newRef, {
            ...formData,
            order: newOrder,
            createdBy: "Doctor", // Explicit marker
            createdByName: "Doctor",
            createdAt: Date.now()
        });

        // Log activity for appointment creation
        const apptActivityRef = push(ref(db, `users/${user.uid}/activities`));
        await set(apptActivityRef, {
            type: 'appointment_created',
            timestamp: Date.now(),
            data: {
                appointmentDate: date,
                patientName: formData.name,
                createdBy: 'Doctor'
            }
        });

        // Update Patient Next Visit
        const patientRef = ref(db, `users/${user.uid}/patients/${formData.phone}`);
        const patientSnap = await get(patientRef);
        const nextVisitTs = new Date(date).getTime();

        if (patientSnap.exists()) {
            await update(patientRef, {
                name: formData.name,
                phone: formData.phone,
                age: formData.age || null,
                sex: formData.sex || null,
                address: formData.address || null,
                nextVisit: nextVisitTs
            });
        } else {
            await set(patientRef, {
                name: formData.name,
                phone: formData.phone,
                age: formData.age || null,
                sex: formData.sex || null,
                address: formData.address || null,
                nextVisit: nextVisitTs,
                lastVisit: null
            });

            // Log activity for new patient
            const activityRef = push(ref(db, `users/${user.uid}/activities`));
            await set(activityRef, {
                type: 'patient_created',
                timestamp: Date.now(),
                data: {
                    patientName: formData.name,
                    patientPhone: formData.phone,
                    createdBy: 'Doctor'
                }
            });
        }

        setShowModal(false);
        setFormData({ name: "", phone: "", age: "", sex: "Male", address: "" });
        Swal.fire({
            title: "Success!",
            text: "Appointment Created",
            icon: "success",
            confirmButtonColor: "#007ACC"
        });
    };

    const changeDate = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Headers ... (unchanged) */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Schedules</h1>
                    <p className="text-slate-500">Manage appointments with full control</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FiPlus /> New Appointment
                    </button>

                    <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition">
                            <FiChevronLeft size={20} />
                        </button>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border-none bg-transparent px-2 py-1 outline-none text-slate-700 w-32 text-center font-medium"
                        />
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition">
                            <FiChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List ... (unchanged) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {!appointments.length ? (
                    <div className="p-12 text-center text-slate-400">
                        <FiCalendar size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No appointments for {date}</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">#</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Patient</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Details</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">By</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {appointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((appt, idx) => {
                                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                return (
                                    <tr key={appt.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-6 py-4 text-slate-500 font-bold w-12">{globalIndex}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{appt.name}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="text-sm flex flex-col gap-1">
                                                <span className="flex items-center gap-2"><FiClock className="text-slate-400" /> {appt.phone}</span>
                                                <span className="text-xs text-slate-400">
                                                    {appt.age && `${appt.age}y`} {appt.sex && `• ${appt.sex}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "text-xs px-2 py-1 rounded font-bold uppercase tracking-wider",
                                                appt.createdBy === "Doctor" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                            )}>
                                                {appt.createdBy === "Doctor" ? "Doctor" : (appt.createdByName || "Assistant")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/patients/${appt.phone}`}
                                                    className="p-2 text-[#007ACC] hover:bg-blue-50 rounded-full transition"
                                                    title="View Patient Details"
                                                >
                                                    <FiArrowRight size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(appt.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                    title="Delete Appointment"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                {appointments.length > ITEMS_PER_PAGE && (
                    <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                        <div className="text-sm text-slate-600">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, appointments.length)} of {appointments.length} appointments
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
                                {(() => {
                                    const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);
                                    const maxButtons = Math.min(totalPages, 5);

                                    return Array.from({ length: maxButtons }, (_, i) => {
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
                                    });
                                })()}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(appointments.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={currentPage >= Math.ceil(appointments.length / ITEMS_PER_PAGE)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Modal for "Doctor" Creation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Add Appointment for {date}</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="relative z-50 isolate">
                                <MaterialInput
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    required
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full mt-1 left-0 w-full !bg-white border border-gray-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-[100] ring-1 ring-black ring-opacity-5">
                                        {suggestions.map((p, idx) => {
                                            const truncatedName = p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name;
                                            const displayInfo = p.age ? `${truncatedName}, ${p.age}y` : truncatedName;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectPatient(p)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800">{displayInfo}</div>
                                                        <div className="text-xs text-slate-500">{p.phone}</div>
                                                    </div>
                                                    <div className="text-xs font-medium text-[#007ACC] opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Select
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <MaterialInput label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                            <div className="grid grid-cols-2 gap-4">
                                {(settings?.requiredFields?.age !== false) && (
                                    <MaterialInput label="Age" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                )}

                                {(settings?.requiredFields?.sex !== false) && (
                                    <div className="relative">
                                        <select
                                            className="peer block w-full rounded-t-lg border-0 border-b-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 border-slate-300 focus:border-[#007ACC] focus:outline-none focus:ring-0 transition-colors duration-200"
                                            value={formData.sex}
                                            onChange={e => setFormData({ ...formData, sex: e.target.value })}
                                        >
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                        <label className="absolute top-3 z-10 origin-[0] -translate-y-6 scale-75 transform cursor-text text-sm duration-200 peer-focus:-translate-y-6 peer-focus:scale-75 text-[#007ACC] left-4 pointer-events-none">
                                            Sex
                                        </label>
                                    </div>
                                )}
                            </div>

                            {(settings?.requiredFields?.address !== false) && (
                                <MaterialInput label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#007ACC] text-white rounded-lg font-bold hover:bg-blue-600">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
