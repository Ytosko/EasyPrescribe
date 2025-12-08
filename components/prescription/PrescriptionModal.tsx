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

export default function PrescriptionModal({ isOpen = true, onClose, onSave, user, patientPhone, patientData, className = "" }: PrescriptionModalProps) {
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // General Form State
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [nextVisit, setNextVisit] = useState({ amount: 7, unit: 'Days' });

    // Dynamic Patient Fields State
    // We store ALL patient data here, driven by the template keys
    const [patientFields, setPatientFields] = useState<{ [key: string]: string }>({});

    // Medicine State
    const [medicines, setMedicines] = useState<any[]>([]);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', duration: '', instruction: '' });

    // Flatten / Unflatten Helpers
    const flattenObject = (obj: any, prefix = '') => {
        let result: any = {};
        for (const i in obj) {
            if (typeof obj[i] === 'object' && obj[i] !== null && !Array.isArray(obj[i])) {
                const flatObject = flattenObject(obj[i], prefix + i + ".");
                for (const x in flatObject) {
                    result[x] = flatObject[x];
                }
            } else {
                result[prefix + i] = obj[i];
            }
        }
        return result;
    };

    const unflattenObject = (data: any) => {
        const result: any = {};
        for (const i in data) {
            const keys = i.split('.');
            keys.reduce((acc: any, value, index) => {
                return acc[value] || (acc[value] = (isNaN(Number(keys[index + 1])) ? (keys.length - 1 === index ? data[i] : {}) : []));
            }, result);
        }
        return result;
    };

    useEffect(() => {
        if (user) {
            loadConfigs();
        }
    }, [user]);

    const loadConfigs = async () => {
        setLoading(true);
        const db = getDatabase(app);
        try {
            const settingsSnap = await get(ref(db, `users/${user.uid}/settings/prescription`));
            if (settingsSnap.exists()) {
                const settings = settingsSnap.val();
                let configList: any[] = [];
                let defaultId = settings.defaultId;

                if (settings.configurations) {
                    configList = Object.entries(settings.configurations).map(([key, val]: [string, any]) => ({
                        id: key,
                        name: val.data?.configName || val.name || "Untitled Config",
                        fullData: val,
                        templateName: val.template?.name || 'template_A'
                    }));
                }

                // Add Local Templates for Testing
                if (configList.length === 0) {
                    configList.push({ id: 'test_A', name: 'Test Config A', templateName: 'template_A', fullData: { data: {} } });
                    configList.push({ id: 'test_B', name: 'Test Config B', templateName: 'template_B', fullData: { data: {} } });
                }

                setConfigs(configList);
                if (defaultId && configList.find(c => c.id === defaultId)) {
                    setSelectedConfigId(defaultId);
                } else if (configList.length > 0) {
                    setSelectedConfigId(configList[0].id);
                }
            } else {
                setConfigs([
                    { id: 'test_A', name: 'Test Config A', templateName: 'template_A', fullData: { data: {} } },
                    { id: 'test_B', name: 'Test Config B', templateName: 'template_B', fullData: { data: {} } }
                ]);
                setSelectedConfigId('test_A');
            }
        } catch (error) {
            console.error("Error loading configs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic Schema Loading
    useEffect(() => {
        const fetchSchema = async () => {
            if (selectedConfigId && configs.length > 0) {
                const config = configs.find(c => c.id === selectedConfigId);
                if (config) {
                    console.log("Fetching schema for:", config.templateName);

                    // 1. Get Schema Name & Load Data
                    const templateData = await getTemplateData(config.templateName);

                    // 2. Determine Fields from Template Keys
                    const schemaPatientData = templateData?.patient || {};
                    const flatSchema = flattenObject(schemaPatientData);

                    // 3. Prepare Initial State
                    // Start with empty strings for all schema keys
                    const initialFields: { [key: string]: string } = {};
                    Object.keys(flatSchema).forEach(key => initialFields[key] = "");

                    // 4. Pre-fill from Saved Config Defaults (if valid)
                    const savedPatientData = config.fullData.data?.patient || {};
                    const flatSaved = flattenObject(savedPatientData);
                    Object.keys(flatSaved).forEach(key => {
                        if (initialFields.hasOwnProperty(key)) {
                            // Only use saved default if present, otherwise keep empty
                            initialFields[key] = flatSaved[key] || "";
                        }
                    });

                    // 5. Pre-fill Patient Profile Data (Highest Priority for Identity)
                    // We map common keys: name, age, sex/gender
                    if (patientData) {
                        if (initialFields.hasOwnProperty('name')) initialFields['name'] = patientData.name || patientData.patientName || initialFields['name'];
                        if (initialFields.hasOwnProperty('age')) initialFields['age'] = patientData.age || initialFields['age'];
                        if (initialFields.hasOwnProperty('sex')) initialFields['sex'] = patientData.sex || patientData.gender || initialFields['sex'];
                        // Fallbacks for common variations
                        if (initialFields.hasOwnProperty('gender') && !initialFields['sex']) initialFields['gender'] = patientData.sex || patientData.gender || initialFields['gender'];
                    }

                    // 6. Set Dynamic Fields
                    setPatientFields(initialFields);

                    // 7. Load Medicines
                    // If the saved config has medicines, use them. Otherwise empty.
                    const savedPages = config.fullData.data?.pages || [];
                    if (savedPages.length > 0 && savedPages[0].medicines) {
                        setMedicines(savedPages[0].medicines);
                    } else {
                        setMedicines([]);
                    }
                }
            }
        };
        fetchSchema();
    }, [selectedConfigId, configs, patientData]);

    const handleAddMedicine = () => {
        if (!newMed.name) return;
        setMedicines(prev => [...prev, { ...newMed, index: prev.length + 1 }]);
        setNewMed({ name: '', dosage: '', duration: '', instruction: '' });
    };

    const handleDeleteMedicine = (index: number) => {
        setMedicines(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const selectedConfig = configs.find(c => c.id === selectedConfigId);
        if (!selectedConfig) return;

        const baseData = selectedConfig.fullData.data || {};

        // Construct Pages Array with Updated Medicines
        const pages = baseData.pages || [{}];
        pages[0].medicines = medicines.map((m, i) => ({ ...m, index: i + 1 }));

        // Pre-process fields for formatting
        // Request: "for notes: for eachline breaker put <br></br> instead \n"
        const formattedFields = { ...patientFields };
        if (formattedFields['notes']) {
            // Replace standard newlines with <br> tags for HTML rendering
            formattedFields['notes'] = formattedFields['notes'].replace(/\n/g, '<br>');
        }

        // Reconstruct dynamic fields
        const dynamicPatientTree = unflattenObject(formattedFields);

        // Final Merge
        const finalData = {
            ...baseData,
            template: {
                ...(baseData.template || {}),
                name: selectedConfig.templateName // Ensure template name is saved for rendering
            },
            date: date,
            pages: pages,
            patient: {
                ...baseData.patient, // structure
                ...dynamicPatientTree // values
            },
            next_visit_duration: `${nextVisit.amount} ${nextVisit.unit}`
        };

        onSave(finalData);
    };

    // Render Helpers
    // We categorise fields simply by name to decide UI representation (TextArea vs Input)
    const isLongField = (key: string) => {
        const lower = key.toLowerCase();
        return lower.includes('cc') || lower.includes('notes') || lower.includes('tests') || lower.includes('history') || lower.includes('instruction') || lower.includes('dx') || lower.includes('advice');
    };

    // Date Field Helpers
    const isDateField = (key: string) => {
        const lower = key.toLowerCase();
        return lower === 'lmp' || lower === 'edd';
    };

    if (!isOpen) return null;

    return (
        <div className={`flex flex-col h-full bg-slate-50 ${className}`}>
            {/* Toolbar */}
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center shrink-0 rounded-t-xl">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Template:</span>
                    <select
                        value={selectedConfigId}
                        onChange={(e) => setSelectedConfigId(e.target.value)}
                        className="bg-slate-700 border-none rounded px-2 py-1 text-xs font-semibold text-white focus:ring-1 focus:ring-blue-500"
                    >
                        {configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="text-xs font-mono text-slate-400">{date}</div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 grid grid-cols-12 bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm">

                {/* Col 1 & 2: Dynamic Patient Fields (7 Columns) */}
                <div className="col-span-7 border-r border-slate-100 p-4">
                    <Section title="Patient & Clinical Data" icon={<FiUser />}>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(patientFields).map(key => {
                                const isLong = isLongField(key);
                                const isDate = isDateField(key);

                                // Special Handler for LMP to auto-calc EDD
                                const handleChange = (val: string) => {
                                    setPatientFields(prev => {
                                        const next = { ...prev, [key]: val };

                                        // Auto-calculate EDD if LMP changes
                                        if (key.toLowerCase() === 'lmp' && val) {
                                            const lmpDate = new Date(val);
                                            if (!isNaN(lmpDate.getTime())) {
                                                // Naegele's rule: +280 days (or +9 months +7 days approx 280)
                                                // Exact: 280 days is standard clinical practice in code
                                                const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
                                                const eddString = eddDate.toISOString().split('T')[0];

                                                // Only update EDD if the field exists in our template
                                                // Find the exact key case used in the object (e.g. 'edd', 'EDD', 'Edd')
                                                const eddKey = Object.keys(prev).find(k => k.toLowerCase() === 'edd');
                                                if (eddKey) {
                                                    next[eddKey] = eddString;
                                                }
                                            }
                                        }
                                        return next;
                                    });
                                };

                                return (
                                    <div key={key} className={`${isLong ? 'col-span-2' : 'col-span-1'}`}>
                                        {isLong ? (
                                            <div className="flex flex-col gap-1">
                                                <Label>{key.replace(/_/g, ' ').toUpperCase()}</Label>
                                                <textarea
                                                    value={patientFields[key]}
                                                    onChange={(e) => handleChange(e.target.value)}
                                                    className="w-full p-3 text-base font-medium border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50 shadow-sm h-auto min-h-[6rem] overflow-hidden"
                                                    placeholder="..."
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                        target.style.height = `${target.scrollHeight}px`;
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <CompactInput
                                                type={isDate ? "date" : "text"}
                                                label={key.replace(/_/g, ' ').replace(/\./g, ' > ')}
                                                value={patientFields[key]}
                                                onChange={handleChange}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </div>

                {/* Col 3: Medicines & Actions (5 Columns) */}
                <div className="col-span-5 bg-slate-50 relative border-l border-slate-200">
                    <div className="sticky top-0 h-screen max-h-screen overflow-y-auto custom-scrollbar p-4 flex flex-col">
                        {/* Medicine List Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">💊</span>
                            <span className="text-sm font-bold text-slate-700 uppercase">Medicines</span>
                        </div>

                        {/* Medicine Input Form */}
                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-3 mb-3">

                            {/* Row 1: Name & Dosage Input */}
                            <div className="flex gap-2">
                                <input
                                    value={newMed.name}
                                    onChange={(e) => setNewMed(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Medicine Name"
                                    className="flex-1 text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-bold shadow-sm"
                                />
                                <div className="flex flex-col w-32 gap-1">
                                    <input
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                                        placeholder="1+0+1"
                                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-center font-mono font-medium shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Dosage Toggles (Smart Logic) */}
                            <div className="flex justify-end gap-1">
                                {['M', 'L', 'D', 'N'].map((label, idx) => {
                                    // Logic to determine if active
                                    const parts = newMed.dosage.split('+').map(s => s.trim());
                                    const isActive = parts[idx] && parts[idx] !== '0';

                                    const toggle = () => {
                                        let currentParts = [...parts];
                                        // Pad if missing
                                        while (currentParts.length <= idx) currentParts.push('0');
                                        // Ensure standard length of at least 3 (M+L+D) if simplified
                                        if (currentParts.length < 3) while (currentParts.length < 3) currentParts.push('0');

                                        // Toggle logic: '0' -> '1', anything else -> '0'
                                        if (currentParts[idx] && currentParts[idx] !== '0') {
                                            currentParts[idx] = '0';
                                        } else {
                                            currentParts[idx] = '1';
                                        }

                                        // Refine output: 
                                        // If N (index 3) is 0, we can optionally simplify to 3 parts if user prefers, 
                                        // but sticking to 3 or 4 parts consistent is safer.
                                        // Let's trim trailing zeros if length > 3? No, "1+0+0+0" is explicit.

                                        // Clean up: join with +
                                        setNewMed(p => ({ ...p, dosage: currentParts.join('+') }));
                                    };

                                    return (
                                        <button
                                            key={label}
                                            onClick={toggle}
                                            className={`
                                                w-8 h-8 rounded-full text-[10px] font-bold transition-all border
                                                ${isActive
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500'}
                                            `}
                                            title={label === 'M' ? 'Morning' : label === 'L' ? 'Lunch' : label === 'D' ? 'Dinner' : 'Night'}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Row 3: Duration, Instruction, Add Button */}
                            <div className="flex gap-2">
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
                            </div>
                        </div>

                        {/* Medicine List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                            {medicines.map((med, idx) => (
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
                            ))}
                            {medicines.length === 0 && (
                                <div className="text-center py-8 text-xs text-slate-400 italic">
                                    No medicines added yet.
                                </div>
                            )}
                        </div>

                        {/* Bottom Bar: Next Visit & Actions */}
                        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
