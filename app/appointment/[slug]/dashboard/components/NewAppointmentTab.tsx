"use client";

import { useState, useEffect, useRef } from "react";
import { getDatabase, ref, get, set, update, push, query, orderByKey, startAt, endAt, limitToFirst } from "firebase/database";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { FiUser, FiCheck } from "react-icons/fi";
import { clsx } from "clsx";
import Swal from "sweetalert2";

interface Settings {
    requiredFields: {
        name: boolean;
        phone: boolean;
        age: boolean;
        sex: boolean;
        address: boolean;
    };
    dailyLimit: number;
    maxFutureDays: number;
}

interface NewAppointmentTabProps {
    session: any;
    settings: Settings;
    onSuccess: (date: string) => void;
}

export function NewAppointmentTab({ session, settings, onSuccess }: NewAppointmentTabProps) {
    const [date, setDate] = useState<string>("");
    const [formData, setFormData] = useState({ name: "", phone: "", age: "", sex: "Male", address: "" });
    const [loading, setLoading] = useState(false);

    // Patient Search Suggestions
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isSelectingPatient = useRef(false); // Track if we're selecting a patient

    // Initial Date (Tomorrow)
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        setDate(d.toISOString().split('T')[0]);
    }, []);

    // Generate Date Chips
    const generateDateOptions = () => {
        const options = [];
        const days = settings.maxFutureDays || 3;
        const today = new Date();

        // Start from Today (0) to Max Days
        for (let i = 0; i <= days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];

            // Format: "Today", "Tomorrow" or "Fri, 08 Dec"
            let label = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
            if (i === 0) label = "Today";
            if (i === 1) label = "Tomorrow";

            options.push({ value: dateStr, label });
        }
        return options;
    };

    const dateOptions = generateDateOptions();

    // Patient Lookup by Phone (Suggestions)
    useEffect(() => {
        if (isSelectingPatient.current) {
            // Skip search if we're in the middle of selecting a patient
            isSelectingPatient.current = false;
            return;
        }

        if (!formData.phone || formData.phone.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false); // Hide popup for short input
            return;
        }

        const timer = setTimeout(async () => {
            if (!session) return;
            const db = getDatabase();
            const patientsRef = ref(db, `users/${session.doctorUid}/patients`);

            // Query for phones starting with input
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
    }, [formData.phone, session]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const db = getDatabase();

            // Check limits first
            const countSnap = await get(ref(db, `users/${session.doctorUid}/appointments/${date}`));
            if (countSnap.exists() && countSnap.size >= settings.dailyLimit) {
                Swal.fire("Limit Reached", "Daily limit reached for this date. Please choose another date.", "warning");
                setLoading(false);
                return;
            }

            const newOrder = countSnap.exists() ? (Math.max(...Object.values(countSnap.val() as any).map((a: any) => a.order as number)) + 1) : 1;

            // Save Appointment
            const newRef = push(ref(db, `users/${session.doctorUid}/appointments/${date}`));
            await set(newRef, {
                ...formData,
                order: newOrder,
                createdBy: session.id,
                createdByName: session.name,
                createdAt: Date.now()
            });

            // Log activity for appointment creation
            const apptActivityRef = push(ref(db, `users/${session.doctorUid}/activities`));
            await set(apptActivityRef, {
                type: 'appointment_created',
                timestamp: Date.now(),
                data: {
                    appointmentDate: date,
                    patientName: formData.name,
                    createdBy: session.name
                }
            });

            // Save/Update Patient Data for future lookup
            const patientRef = ref(db, `users/${session.doctorUid}/patients/${formData.phone}`);
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
                const activityRef = push(ref(db, `users/${session.doctorUid}/activities`));
                await set(activityRef, {
                    type: 'patient_created',
                    timestamp: Date.now(),
                    data: {
                        patientName: formData.name,
                        patientPhone: formData.phone,
                        createdBy: session.name
                    }
                });
            }

            setFormData({ name: "", phone: "", age: "", sex: "Male", address: "" });
            Swal.fire("Success!", "Appointment Booked Successfully!", "success");

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to book appointment.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#007ACC] flex items-center justify-center">
                    <FiUser />
                </div>
                New Appointment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Appointment Date</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {dateOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setDate(opt.value)}
                                className={clsx(
                                    "px-4 py-3 rounded-lg text-sm font-bold border transition-all text-center",
                                    date === opt.value
                                        ? "bg-[#007ACC] text-white border-[#007ACC] shadow-md ring-2 ring-offset-1 ring-[#007ACC]"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                <div className="text-xs opacity-80 uppercase tracking-wider mb-0.5">
                                    {opt.label === "Today" ? "Today" : opt.label === "Tomorrow" ? "Tomorrow" : opt.label.split(',')[0]}
                                </div>
                                <div className="text-base">
                                    {(opt.label === "Today" || opt.label === "Tomorrow")
                                        ? new Date(opt.value).getDate() + " " + new Date(opt.value).toLocaleString('default', { month: 'short' })
                                        : opt.label.split(', ')[1]}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone First for Lookup */}
                    <div className="relative z-50 isolate">
                        <MaterialInput
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            required
                            autoComplete="off"
                        />
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full -mt-2 left-0 w-full !bg-white border border-gray-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-[100] ring-1 ring-black ring-opacity-5">
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

                    <MaterialInput
                        label="Patient Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    {settings.requiredFields.age && (
                        <MaterialInput
                            label="Age"
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                    )}

                    {settings.requiredFields.sex && (
                        <div className="relative mb-6">
                            <div className="relative">
                                <select
                                    className="peer block w-full rounded-t-lg border-0 border-b-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 border-slate-300 focus:border-[#007ACC] focus:outline-none focus:ring-0 transition-colors duration-200"
                                    value={formData.sex}
                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                                <label className="absolute top-3 z-10 origin-[0] -translate-y-6 scale-75 transform cursor-text text-sm duration-200 peer-focus:-translate-y-6 peer-focus:scale-75 text-[#007ACC] left-4 pointer-events-none">
                                    Sex
                                </label>
                            </div>
                        </div>
                    )}

                    {settings.requiredFields.address && (
                        <div className="md:col-span-2">
                            <MaterialInput
                                label="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full md:w-auto min-w-[200px]"
                    >
                        {loading ? "Booking..." : "Confirm Appointment"}
                    </button>
                </div>
            </form>
        </div>
    );
}
