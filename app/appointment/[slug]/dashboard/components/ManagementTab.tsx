"use client";

import { useState, useEffect } from "react";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { FiCalendar, FiPhone, FiUser, FiMapPin, FiTrash2, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Swal from "sweetalert2";

interface Settings {
    dailyLimit: number;
    maxFutureDays: number;
    requiredFields: any;
}

interface ManagementTabProps {
    session: any;
    settings: Settings;
}

export function ManagementTab({ session, settings }: ManagementTabProps) {
    const [date, setDate] = useState<string>("");
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        const storedDate = localStorage.getItem("assistant_last_managed_date");
        if (storedDate) {
            setDate(storedDate);
        } else {
            const d = new Date();
            setDate(d.toISOString().split('T')[0]);
        }
    }, []);

    useEffect(() => {
        if (date) {
            localStorage.setItem("assistant_last_managed_date", date);
        }
    }, [date]);

    useEffect(() => {
        if (!session || !date) return;
        const db = getDatabase();
        const apptRef = ref(db, `users/${session.doctorUid}/appointments/${date}`);

        const unsubscribe = onValue(apptRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                list.sort((a, b) => a.order - b.order);
                setAppointments(list);
            } else {
                setAppointments([]);
            }
        });
        return () => unsubscribe();
    }, [date, session]);

    const handleDelete = async (id: string) => {
        // Prevent deletion of past appointments
        const isPast = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
        if (isPast) {
            Swal.fire("Read Only", "Cannot delete past appointments. Past appointments are read-only.", "info");
            return;
        }

        const result = await Swal.fire({
            title: "Delete Appointment?",
            text: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Yes, delete it"
        });

        if (!result.isConfirmed) return;

        const db = getDatabase();
        await remove(ref(db, `users/${session.doctorUid}/appointments/${date}/${id}`));
        Swal.fire("Deleted!", "Appointment deleted.", "success");
    };

    const moveOrder = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === appointments.length - 1) return;

        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        const currentItem = appointments[index];
        const otherItem = appointments[otherIndex];

        const db = getDatabase();
        const updates: any = {};
        updates[`users/${session.doctorUid}/appointments/${date}/${currentItem.id}/order`] = otherItem.order;
        updates[`users/${session.doctorUid}/appointments/${date}/${otherItem.id}/order`] = currentItem.order;

        await update(ref(db), updates);
    };

    const changeDate = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const isPastDate = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div className="space-y-4">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-[#007ACC] to-blue-600 rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FiCalendar size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Appointments</h2>
                            <p className="text-xs text-blue-100">Manage bookings</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Compact Date Navigator */}
                        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                            <button
                                type="button"
                                onClick={() => changeDate(-1)}
                                className="p-2 hover:bg-white/20 rounded-l-lg transition"
                            >
                                <FiChevronLeft size={16} className="text-white" />
                            </button>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border-none bg-transparent px-2 py-1 outline-none text-white text-sm font-medium w-32 text-center"
                            />
                            <button
                                type="button"
                                onClick={() => changeDate(1)}
                                className="p-2 hover:bg-white/20 rounded-r-lg transition"
                            >
                                <FiChevronRight size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Compact Count */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg">
                            <span className="text-white text-sm font-bold">{appointments.length}/{settings.dailyLimit}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Appointments List */}
            {appointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <FiCalendar size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-500 text-sm">No appointments for this date</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {appointments.map((appt, idx) => (
                        <div
                            key={appt.id}
                            className="group flex items-center gap-3 p-3 hover:bg-slate-50 transition"
                        >
                            {/* Compact Number Badge */}
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#007ACC] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {idx + 1}
                            </div>

                            {/* Patient Info - Compact */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{appt.name}</h4>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <FiPhone size={10} className="text-[#007ACC]" />
                                        {appt.phone}
                                    </span>
                                    {appt.age && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="flex items-center gap-1">
                                                <FiUser size={10} className="text-[#007ACC]" />
                                                {appt.age}y, {appt.sex || 'N/A'}
                                            </span>
                                        </>
                                    )}
                                    {appt.address && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                <FiMapPin size={10} className="text-[#007ACC]" />
                                                {appt.address}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Compact Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                {/* Reorder */}
                                <button
                                    onClick={() => moveOrder(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 text-slate-400 hover:text-[#007ACC] hover:bg-blue-50 rounded transition disabled:opacity-0"
                                    title="Move up"
                                >
                                    <FiChevronUp size={14} />
                                </button>
                                <button
                                    onClick={() => moveOrder(idx, 'down')}
                                    disabled={idx === appointments.length - 1}
                                    className="p-1.5 text-slate-400 hover:text-[#007ACC] hover:bg-blue-50 rounded transition disabled:opacity-0"
                                    title="Move down"
                                >
                                    <FiChevronDown size={14} />
                                </button>

                                {/* Delete - disabled for past dates */}
                                <button
                                    onClick={() => handleDelete(appt.id)}
                                    disabled={isPastDate}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isPastDate ? "Cannot delete past appointments" : "Delete appointment"}
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Compact Past Notice */}
            {isPastDate && appointments.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 text-xs flex items-center gap-2">
                    <FiCalendar size={14} />
                    <p>Viewing past appointments (read-only)</p>
                </div>
            )}
        </div>
    );
}
