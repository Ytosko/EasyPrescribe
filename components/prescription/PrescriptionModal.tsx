"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiSave, FiCalendar, FiUser, FiActivity, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import { getTemplateData } from "@/app/actions/getTemplate";
import { searchMedicines } from "@/app/actions/getMedicines";
import { createPrescription } from "@/app/actions/createPrescription";

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
    const [patientFields, setPatientFields] = useState<{ [key: string]: string }>({});

    // Field Configuration State (Parsed Metadata)
    const [fieldConfigs, setFieldConfigs] = useState<{ [key: string]: any }>({});

    // Medicine State
    const [medicines, setMedicines] = useState<any[]>([]);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', duration: '', instruction: '' });

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // --- Helpers ---

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

    // Parsing Helper for New Template Syntax
    const parseFieldConfig = (value: string) => {
        let config = {
            inputType: 'text', // default
            suffix: '',
            options: [] as string[],
            replaceNewlines: false
        };

        if (typeof value !== 'string') return config;

        if (value.includes('->')) {
            const [typePart, rulePart] = value.split('->').map(s => s.trim());

            // 1. Determine Input Type
            if (typePart.includes('number')) config.inputType = 'number';
            else if (typePart.includes('radio')) config.inputType = 'radio';
            else if (typePart.includes('date')) config.inputType = 'date';
            else if (typePart.includes('textarea')) config.inputType = 'textarea';
            else if (typePart.includes('text')) config.inputType = 'text';

            // 2. Parse Rules
            if (config.inputType === 'number') {
                // "input + 'Yrs'" -> extract 'Yrs'
                const match = rulePart.match(/'([^']+)'/);
                if (match) config.suffix = match[1];
            } else if (config.inputType === 'radio') {
                // "'Nil' or 'Present'" -> ['Nil', 'Present']
                config.options = rulePart.split(' or ').map(opt => opt.replace(/'/g, '').trim());
            } else if (config.inputType === 'textarea' || config.inputType === 'text') {
                if (rulePart.includes('replace \\n with <br>')) config.replaceNewlines = true;
            }
        } else {
            // Fallback for fields without "->" syntax (Legacy Support)
            const lower = value.toLowerCase();
            if (lower.includes('cc') || lower.includes('notes') || lower.includes('tests') || lower.includes('history') || lower.includes('instruction') || lower.includes('dx') || lower.includes('advice')) {
                config.inputType = 'textarea';
            }
        }
        return config;
    };

    // --- Effects ---

    useEffect(() => {
        if (user) {
            loadConfigs();
        }
    }, [user]);

    // Debounced Search Effect
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (newMed.name && newMed.name.length >= 2 && showSuggestions) {
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                const results = await searchMedicines(newMed.name);
                setSuggestions(results);
                setIsSearching(false);
            }, 300);
        } else {
            setSuggestions([]);
            setIsSearching(false);
        }

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [newMed.name, showSuggestions]);

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

    useEffect(() => {
        const fetchSchema = async () => {
            if (selectedConfigId && configs.length > 0) {
                const config = configs.find(c => c.id === selectedConfigId);
                if (config) {
                    const templateData = await getTemplateData(config.templateName);
                    const schemaPatientData = templateData?.patient || {};
                    const flatSchema = flattenObject(schemaPatientData);

                    const initialFields: { [key: string]: string } = {};
                    const newFieldConfigs: { [key: string]: any } = {};

                    Object.keys(flatSchema).forEach(key => {
                        const templateValue = flatSchema[key];
                        newFieldConfigs[key] = parseFieldConfig(templateValue);
                        initialFields[key] = "";
                    });

                    const savedPatientData = config.fullData.data?.patient || {};
                    const flatSaved = flattenObject(savedPatientData);
                    Object.keys(flatSaved).forEach(key => {
                        if (initialFields.hasOwnProperty(key)) {
                            let val = flatSaved[key] || "";

                            const conf = newFieldConfigs[key];
                            if (conf && conf.inputType === 'number' && conf.suffix) {
                                if (val.endsWith(conf.suffix)) val = val.replace(conf.suffix, '').trim();
                                else if (val.endsWith(` ${conf.suffix}`)) val = val.replace(` ${conf.suffix}`, '').trim();
                            }

                            if (conf && conf.replaceNewlines && val.includes('<br>')) {
                                val = val.replace(/<br>/g, '\n');
                            }

                            initialFields[key] = val;
                        }
                    });

                    if (patientData) {
                        if (initialFields.hasOwnProperty('name')) initialFields['name'] = patientData.name || patientData.patientName || initialFields['name'];

                        let pAge = patientData.age || "";
                        if (pAge && (pAge.includes('Yr') || pAge.includes('Year'))) {
                            pAge = pAge.replace(/Yr.*/i, '').replace(/Year.*/i, '').trim();
                        }
                        if (initialFields.hasOwnProperty('age')) initialFields['age'] = pAge || initialFields['age'];

                        if (initialFields.hasOwnProperty('sex')) initialFields['sex'] = patientData.sex || patientData.gender || initialFields['sex'];
                        if (initialFields.hasOwnProperty('gender') && !initialFields['sex']) initialFields['gender'] = patientData.sex || patientData.gender || initialFields['gender'];
                    }

                    setPatientFields(initialFields);
                    setFieldConfigs(newFieldConfigs);

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

    const handleSelectMedicine = (med: any) => {
        setNewMed(p => ({ ...p, name: med.full }));
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleMedNameChange = (val: string) => {
        setNewMed(p => ({ ...p, name: val }));
        if (val.length >= 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };


    const handleSave = () => {
        const selectedConfig = configs.find(c => c.id === selectedConfigId);
        if (!selectedConfig) return;

        const baseData = selectedConfig.fullData.data || {};
        const pages = baseData.pages || [{}];
        pages[0].medicines = medicines.map((m, i) => ({ ...m, index: i + 1 }));

        const formattedFields = { ...patientFields };

        Object.keys(formattedFields).forEach(key => {
            const conf = fieldConfigs[key];
            let val = formattedFields[key];

            if (conf && val) {
                if (conf.inputType === 'number' && conf.suffix) {
                    if (!val.endsWith(conf.suffix)) {
                        val = `${val} ${conf.suffix}`;
                    }
                }

                if (conf.inputType === 'date') {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        val = d.toLocaleDateString('en-GB');
                    }
                }

                if (conf.replaceNewlines && val) {
                    val = val.replace(/\n/g, '<br>');
                }
            }
            formattedFields[key] = val;
        });

        const dynamicPatientTree = unflattenObject(formattedFields);

        // ... (data preparation) ...

        const finalData = {
            ...baseData,
            template: {
                ...(baseData.template || {}),
                name: selectedConfig.templateName
            },
            date: date,
            pages: pages,
            patient: {
                ...baseData.patient,
                ...dynamicPatientTree
            },
            next_visit_duration: `${nextVisit.amount} ${nextVisit.unit}`
        };

        const executeCreation = async () => {
            setLoading(true);
            try {
                const result = await createPrescription(selectedConfig.templateName, finalData);
                if (result.success && result.pdfUrl) {
                    onSave({
                        pdfUrl: result.pdfUrl,
                        templateName: selectedConfig.templateName,
                        generatedAt: Date.now(),
                        nextVisit: nextVisit // Passing nextVisit explicitely
                    });
                } else {
                    console.error("Failed to generate PDF:", result.error);
                    alert("Failed to create prescription PDF. Please try again.");
                }
            } catch (e) {
                console.error(e);
                alert("An error occurred.");
            } finally {
                setLoading(false);
            }
        };

        executeCreation();
    };

    const renderField = (key: string) => {
        const conf = fieldConfigs[key] || { inputType: 'text' };
        const val = patientFields[key];

        const onChange = (v: string) => {
            setPatientFields(p => {
                const updated = { ...p, [key]: v };
                if (key.toLowerCase() === 'lmp' && v) {
                    const lmpDate = new Date(v);
                    const eddKey = Object.keys(p).find(k => k.toLowerCase() === 'edd');
                    if (!isNaN(lmpDate.getTime()) && eddKey) {
                        const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
                        updated[eddKey] = eddDate.toISOString().split('T')[0];
                    }
                }
                return updated;
            });
        };

        if (conf.inputType === 'number') {
            return (
                <div className="flex flex-col gap-1">
                    <Label>{key.replace(/_/g, ' ').toUpperCase()}</Label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={val}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full text-base font-bold text-slate-700 py-2 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            placeholder="0"
                        />
                        {conf.suffix && (
                            <span className="absolute right-0 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                                {conf.suffix}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        if (conf.inputType === 'radio') {
            return (
                <div className="flex flex-col gap-2">
                    <Label>{key.replace(/_/g, ' ').toUpperCase()}</Label>
                    <div className="flex flex-wrap gap-2">
                        {conf.options?.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => onChange(opt)}
                                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${val === opt
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )
        }

        if (conf.inputType === 'date') {
            return (
                <CompactInput
                    type="date"
                    label={key.replace(/_/g, ' ').replace(/\./g, ' > ')}
                    value={val}
                    onChange={onChange}
                />
            );
        }

        if (conf.inputType === 'textarea') {
            return (
                <div className="flex flex-col gap-1">
                    <Label>{key.replace(/_/g, ' ').toUpperCase()}</Label>
                    <textarea
                        value={val}
                        onChange={(e) => onChange(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-base font-medium border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50 shadow-sm"
                        placeholder="..."
                    />
                </div>
            )
        }

        return (
            <CompactInput
                label={key.replace(/_/g, ' ').replace(/\./g, ' > ')}
                value={val}
                onChange={onChange}
            />
        );
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
                                const conf = fieldConfigs[key] || { inputType: 'text' };
                                const isLong = conf.inputType === 'textarea' || conf.inputType === 'radio';
                                return (
                                    <div key={key} className={`${isLong ? 'col-span-2' : 'col-span-1'}`}>
                                        {renderField(key)}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </div>

                {/* Col 3: Medicines & Actions (5 Columns) */}
                <div className="col-span-5 bg-slate-50 relative border-l border-slate-200">
                    <div className="sticky top-0 h-screen max-h-screen overflow-y-auto custom-scrollbar p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">💊</span>
                            <span className="text-sm font-bold text-slate-700 uppercase">Medicines</span>
                        </div>

                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-3 mb-3">
                            <div className="flex gap-2 relative">
                                <div className="flex-1 relative">
                                    <input
                                        value={newMed.name}
                                        onChange={(e) => handleMedNameChange(e.target.value)}
                                        placeholder="Medicine Name"
                                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-bold shadow-sm"
                                    />
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                            {suggestions.map((med, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleSelectMedicine(med)}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between border-b border-slate-50 last:border-none"
                                                >
                                                    <span className="text-sm font-bold text-slate-800">{med.name}</span>
                                                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1 rounded">{med.strength}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col w-32 gap-1">
                                    <input
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                                        placeholder="1+0+1"
                                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-center font-mono font-medium shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-1">
                                {['M', 'L', 'D', 'N'].map((label, idx) => {
                                    const parts = newMed.dosage.split('+').map(s => s.trim());
                                    const isActive = parts[idx] && parts[idx] !== '0';

                                    const toggle = () => {
                                        let currentParts = [...parts];
                                        while (currentParts.length <= idx) currentParts.push('0');
                                        if (currentParts.length < 3) while (currentParts.length < 3) currentParts.push('0');

                                        if (currentParts[idx] && currentParts[idx] !== '0') {
                                            currentParts[idx] = '0';
                                        } else {
                                            currentParts[idx] = '1';
                                        }

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

                            <div className="flex gap-2">
                                <input
                                    value={newMed.duration}
                                    onChange={(e) => setNewMed(p => ({ ...p, duration: e.target.value }))}
                                    placeholder="Duration"
                                    list="duration-options"
                                    className="w-1/3 text-sm p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none shadow-sm"
                                />
                                <input
                                    value={newMed.instruction}
                                    onChange={(e) => setNewMed(p => ({ ...p, instruction: e.target.value }))}
                                    placeholder="Instruction"
                                    list="instruction-options"
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

                            {/* Datalists for Autocomplete */}
                            <datalist id="duration-options">
                                <option value="3 Days" />
                                <option value="5 Days" />
                                <option value="7 Days" />
                                <option value="10 Days" />
                                <option value="15 Days" />
                                <option value="1 Month" />
                                <option value="Continued" />
                            </datalist>
                            <datalist id="instruction-options">
                                <option value="Before Meal" />
                                <option value="After Meal" />
                                <option value="Any Time" />
                                <option value="At Night" />
                                <option value="In the Morning" />
                                <option value="Empty Stomach" />
                            </datalist>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4">
                            <div className="flex flex-col gap-2 bg-blue-100/50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
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
                                <div className="flex gap-2 justify-end">
                                    {[
                                        { l: '7 Days', a: 7, u: 'Days' },
                                        { l: '15 Days', a: 15, u: 'Days' },
                                        { l: '1 Month', a: 1, u: 'Months' }
                                    ].map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setNextVisit({ amount: opt.a, unit: opt.u })}
                                            className="px-2 py-1 text-[10px] font-bold bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition" disabled={loading}>Cancel</button>
                                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 text-xs font-bold bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? <span className="animate-spin">⌛</span> : <FiFileText size={16} />}
                                    {loading ? "Creating..." : "Create Prescription"}
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
