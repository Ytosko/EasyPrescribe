"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "@/lib/firebase";
import { FiSave, FiPrinter, FiLayout, FiUser, FiHome, FiCheck } from "react-icons/fi";
import Swal from "sweetalert2";
import Handlebars from "handlebars";
import { getTemplates, TemplateData } from "@/app/actions/getTemplates";

export default function PrescriptionConfigPage() {
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [configData, setConfigData] = useState<any>(null);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Load User & Templates
    useEffect(() => {
        async function init() {
            const auth = getAuth(app);
            const unsubscribe = auth.onAuthStateChanged(async (u) => {
                if (u) {
                    setUser(u);

                    // 1. Fetch Available Templates
                    const t = await getTemplates();
                    setTemplates(t);

                    if (t.length > 0) {
                        // 2. Fetch User Settings
                        const db = getDatabase(app);
                        const settingsSnap = await get(ref(db, `users/${u.uid}/settings/prescription`));

                        if (settingsSnap.exists()) {
                            const savedSettings = settingsSnap.val();
                            setSelectedTemplate(savedSettings.template.name);
                            setConfigData(savedSettings.data);
                        } else {
                            // Default to first template
                            setSelectedTemplate(t[0].name);
                            setConfigData(t[0].defaultData);
                        }
                    }
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }
        init();
    }, []);

    // Generate Preview
    useEffect(() => {
        if (!selectedTemplate || !configData || templates.length === 0) return;

        const template = templates.find(t => t.name === selectedTemplate);
        if (!template) return;

        try {
            const compiled = Handlebars.compile(template.templateContent);
            const html = compiled(configData);
            setPreviewHtml(html);
        } catch (error) {
            console.error("Handlebars render error:", error);
            setPreviewHtml("<div class='p-4 text-red-500'>Error rendering preview</div>");
        }
    }, [selectedTemplate, configData, templates]);

    const handleDataChange = (section: string, field: string, value: string) => {
        setConfigData((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleVariantChange = (variant: string) => {
        setConfigData((prev: any) => ({
            ...prev,
            template: {
                ...prev.template,
                variant: variant
            }
        }));
    };

    const handleSave = async () => {
        if (!user || !configData) return;
        setSaving(true);
        try {
            const db = getDatabase(app);
            await set(ref(db, `users/${user.uid}/settings/prescription`), {
                template: { name: selectedTemplate },
                data: configData
            });
            Swal.fire({
                title: "Saved!",
                text: "Prescription settings updated.",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save settings.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100">
            {/* Left Sidebar: Controls */}
            <div className="w-[450px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-10">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FiLayout className="text-[#007ACC]" /> Paper Configuration
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Customize your prescription layout and details.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Template Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Template</label>
                        <div className="grid grid-cols-2 gap-3">
                            {templates.map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => {
                                        setSelectedTemplate(t.name);
                                        // Merge current data with new template default structure if needed, 
                                        // but for now let's keep user data if possible or reset. 
                                        // Better to reset to new template defaults to avoid structure mismatch.
                                        if (confirm("Switching template will reset current fields to default. Continue?")) {
                                            setConfigData(t.defaultData);
                                        }
                                    }}
                                    className={`p-3 rounded-lg border-2 text-left transition-all relative
                                        ${selectedTemplate === t.name
                                            ? 'border-[#007ACC] bg-blue-50 ring-2 ring-blue-100'
                                            : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold text-slate-700 block">{t.name}</span>
                                    {selectedTemplate === t.name && <FiCheck className="absolute top-2 right-2 text-[#007ACC]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Variant Selection */}
                    {configData && configData.template && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color Variant</label>
                            <div className="flex flex-wrap gap-2">
                                {['variant-1', 'variant-2', 'variant-3', 'variant-4', 'variant-5', 'variant-6', 'variant-7', 'variant-8', 'variant-9', 'variant-10'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => handleVariantChange(v)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                                            ${configData?.template?.variant === v ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border-white shadow-sm'}`}
                                        style={{ backgroundColor: getVariantColor(v) }}
                                        title={v}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Doctor Info Form */}
                    {configData && configData.doctor && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <FiUser className="text-[#007ACC]" />
                                <h3 className="font-bold text-slate-700">Doctor Information</h3>
                            </div>

                            <div className="space-y-3">
                                <InputGroup label="Name (English)" value={configData.doctor.name_en} onChange={(v) => handleDataChange('doctor', 'name_en', v)} />
                                <InputGroup label="Degrees (English)" value={configData.doctor.degrees_en} onChange={(v) => handleDataChange('doctor', 'degrees_en', v)} textarea />
                                <InputGroup label="Name (Bangla)" value={configData.doctor.name_bn} onChange={(v) => handleDataChange('doctor', 'name_bn', v)} />
                                <InputGroup label="Degrees (Bangla)" value={configData.doctor.degrees_bn} onChange={(v) => handleDataChange('doctor', 'degrees_bn', v)} textarea />
                            </div>
                        </div>
                    )}

                    {/* Chamber Info Form */}
                    {configData && configData.chember && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <FiHome className="text-[#007ACC]" />
                                <h3 className="font-bold text-slate-700">Chamber Details</h3>
                            </div>

                            <div className="space-y-3">
                                <InputGroup label="Chamber Name" value={configData.chember.name} onChange={(v) => handleDataChange('chember', 'name', v)} />
                                <InputGroup label="Address" value={configData.chember.address} onChange={(v) => handleDataChange('chember', 'address', v)} />
                                <InputGroup label="Mobile" value={configData.chember.mobile} onChange={(v) => handleDataChange('chember', 'mobile', v)} />
                                <InputGroup label="Logo URL" value={configData.chember.logo_url} onChange={(v) => handleDataChange('chember', 'logo_url', v)} />
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#007ACC] text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                        {saving ? <span className="animate-spin">⌛</span> : <FiSave />}
                        Save Configuration
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">Preview is generated with dummy patient data.</p>
                </div>
            </div>

            {/* Right Side: Preview */}
            <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center">
                <div
                    className="bg-white shadow-2xl relative"
                    style={{ width: '794px', minHeight: '1123px' }} // A4 dimensions approx
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, textarea = false }: { label: string, value: string, onChange: (v: string) => void, textarea?: boolean }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
            {textarea ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none h-20 resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none"
                />
            )}
        </div>
    );
}

function getVariantColor(v: string) {
    const colors: { [key: string]: string } = {
        'variant-1': '#1565c0',
        'variant-2': '#2e7d32',
        'variant-3': '#00897b',
        'variant-4': '#283593',
        'variant-5': '#c62828',
        'variant-6': '#455a64',
        'variant-7': '#6a1b9a',
        'variant-8': '#3f51b5',
        'variant-9': '#558b2f',
        'variant-10': '#37474f',
    };
    return colors[v] || '#cccccc';
}
