"use client";

import { useState, useEffect } from "react";
import { FiX, FiSave, FiCalendar, FiUser, FiActivity, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import { getTemplateData } from "@/app/actions/getTemplate";

interface PrescriptionModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    user: any;
    patientPhone?: string;
    patientData?: any;
    className?: string;
}
                                    );
                                })}
                            </div >

    {/* Row 3: Duration, Instruction, Add Button */ }
    < div className = "flex gap-2" >
                                <input
                                    value={newMed.duration}
                                    onChange={(e) => setNewMed(p => ({ ...p, duration: e.target.value }))}
                                    placeholder="Duration"
                                    className="w-1/3 text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none shadow-sm"
                                />
                                <input
                                    value={newMed.instruction}
                                    onChange={(e) => setNewMed(p => ({ ...p, instruction: e.target.value }))}
                                    placeholder="Instruction"
                                    className="flex-1 text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none shadow-sm"
                                />
                                <button
                                    onClick={handleAddMedicine}
                                    className="bg-[#007ACC] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow-sm font-bold flex items-center justify-center transform active:scale-95"
                                >
                                    <FiPlus size={20} />
                                </button>
                            </div >
                        </div >

    {/* Medicine List */ }
    < div className = "flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1" >
    {
        medicines.map((med, idx) => (
            <div key={idx} className="group flex justify-between items-start p-2 bg-white border border-slate-100 rounded hover:border-blue-200 hover:shadow-sm transition">
                <div className="flex-1">
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-800">{med.name}</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded">{med.dosage}</span>
                    </div>
                    <div className="flex gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span>{med.duration}</span>
                        <span>•</span>
                        <span>{med.instruction}</span>
                    </div>
                </div>
                <button
                    onClick={() => handleDeleteMedicine(idx)}
                    className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                    <FiTrash2 size={12} />
                </button>
            </div>
        ))
    }
{
    medicines.length === 0 && (
        <div className="text-center py-8 text-xs text-slate-400 italic">
            No medicines added yet.
        </div>
    )
}
                        </div >

    {/* Bottom Bar: Next Visit & Actions */ }
    < div className = "mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4" >
                            <div className="flex items-center justify-between bg-blue-100/50 p-3 rounded-lg border border-blue-200">
                                <span className="text-xs font-bold text-blue-800 uppercase">Next Visit</span>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="w-16 p-1 text-center text-sm font-bold border border-blue-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={nextVisit.amount}
                                        onChange={(e) => setNextVisit(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))}
                                    />
                                    <select
                                        className="p-1 text-xs font-bold border border-blue-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={nextVisit.unit}
                                        onChange={(e) => setNextVisit(p => ({ ...p, unit: e.target.value }))}
                                    >
                                        <option>Days</option><option>Weeks</option><option>Months</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
                                <button onClick={handleSave} className="px-6 py-2.5 text-xs font-bold bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition flex items-center gap-2 transform active:scale-95">
                                    <FiSave size={16} /> Save Record
                                </button>
                            </div>
                        </div >
                    </div >
                </div >
            </div >
        </div >
    );
}

function CompactInput({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate" title={label}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full text-sm font-bold text-slate-700 py-2.5 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="..."
            />
        </div>
    );
}

function Section({ title, icon, children }: any) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1">
                {icon} {title}
            </h4>
            {children}
        </div>
    )
}

function Label({ children, className = "" }: any) {
    return <label className={`text-[10px] font-bold text-slate-500 uppercase ${className}`}>{children}</label>
}
