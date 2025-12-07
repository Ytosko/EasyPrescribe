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

    // Config State
    const [configs, setConfigs] = useState<any[]>([]);
    const [defaultConfigId, setDefaultConfigId] = useState<string | null>(null);
    const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
    const [activeConfigData, setActiveConfigData] = useState<any>(null); // The actual data being edited

    // UI State
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [user, setUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        async function init() {
            const auth = getAuth(app);
            const unsubscribe = auth.onAuthStateChanged(async (u) => {
                if (u) {
                    setUser(u);
                    await loadData(u);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }
        init();
    }, []);

    const loadData = async (currentUser: any) => {
        const db = getDatabase(app);

        // Parallel Fetch: Templates, Profile, Configs
        const [templatesData, profileSnap, settingsSnap] = await Promise.all([
            getTemplates(),
            get(ref(db, `users/${currentUser.uid}/profile`)),
            get(ref(db, `users/${currentUser.uid}/settings/prescription`))
        ]);

        setTemplates(templatesData);
        if (profileSnap.exists()) setProfile(profileSnap.val());

        if (settingsSnap.exists()) {
            const settings = settingsSnap.val();
            // Handle legacy single config or new multi-config
            if (settings.configurations) {
                // New Format
                const configList = Object.entries(settings.configurations).map(([key, val]: [string, any]) => ({ id: key, ...val }));
                setConfigs(configList);
                setDefaultConfigId(settings.defaultId || null);
            } else if (settings.template) {
                // Legacy Format Migration (Auto-migrate on save, but mostly just view for now)
                // We won't auto-migrate actively here to avoid side effects on load, 
                // but we can treat it as one config
                const legacyConfig = { id: 'legacy', name: 'Default Setup', ...settings };
                setConfigs([legacyConfig]);
                setDefaultConfigId('legacy');
            }
        }
    };

    // Generate Preview
    useEffect(() => {
        if (viewMode !== 'edit' || !activeConfigData || templates.length === 0) return;

        const templateName = activeConfigData.template.name;
        const template = templates.find(t => t.name === templateName);
        if (!template) return;

        try {
            const compiled = Handlebars.compile(template.templateContent);

            // Construct Render Context: Merge data with template metadata
            // Template expects {{template.variant}} and {{doctor.name}} at root
            const renderContext = {
                ...activeConfigData.data,
                template: activeConfigData.template
            };

            const html = compiled(renderContext);
            setPreviewHtml(html);
        } catch (error) {
            console.error("Handlebars render error:", error);
            setPreviewHtml("<div class='p-4 text-red-500'>Error rendering preview</div>");
        }
    }, [activeConfigData, templates, viewMode]);

    const createNewConfig = () => {
        if (templates.length === 0) return;

        const defaultTemplate = templates[0];

        // Prefill with Real Data if available
        let initialData = { ...defaultTemplate.defaultData };
        if (profile) {
            initialData.doctor = {
                ...initialData.doctor,
                name_en: profile.personal.name.en,
                name_bn: profile.personal.name.bn,
                degrees_en: profile.personal.degrees?.en || "", // Use optional chaining
                degrees_bn: profile.personal.degrees?.bn || "",
                specialty_text: profile.personal.speciality?.en // Map speciality to text for generic use
            };
            if (profile.chamber) {
                initialData.chember = {
                    ...initialData.chember,
                    name: profile.chamber.name.en,
                    address: profile.chamber.address.en,
                    mobile: profile.chamber.contact.en,
                }
            }
        }

        const newConfig = {
            id: 'new', // temp id
            name: "My New Prescription",
            template: { name: defaultTemplate.name, variant: 'variant-1' },
            data: initialData
        };

        setActiveConfigData(newConfig);
        setActiveConfigId(null); // null means new
        setViewMode('edit');
    };

    const editConfig = (config: any) => {
        setActiveConfigData(config);
        setActiveConfigId(config.id);
        setViewMode('edit');
    };

    const handleTemplateChange = (templateName: string) => {
        const template = templates.find(t => t.name === templateName);
        if (!template) return;

        if (confirm("Switching template?")) {
            setActiveConfigData((prev: any) => ({
                ...prev,
                template: { ...prev.template, name: templateName }
                // We kept the data structure same, assuming compatibility or relying on field names
            }));
        }
    };

    const handleDataChange = (section: string, field: string, value: string) => {
        setActiveConfigData((prev: any) => ({
            ...prev,
            data: {
                ...prev.data,
                [section]: {
                    ...prev.data[section],
                    [field]: value
                }
            }
        }));
    };

    // Helper for top-level config fields (like name of the config itself)
    const handleConfigNameChange = (name: string) => {
        setActiveConfigData((prev: any) => ({ ...prev, name }));
    }

    const handleVariantChange = (variant: string) => {
        setActiveConfigData((prev: any) => ({
            ...prev,
            template: {
                ...prev.template,
                variant: variant
            }
        }));
    };

    const saveConfig = async () => {
        if (!user || !activeConfigData) return;
        setSaving(true);
        try {
            const db = getDatabase(app);
            const configId = activeConfigId || Date.now().toString();

            // Structure to save
            const configToSave = {
                name: activeConfigData.name,
                template: activeConfigData.template,
                data: activeConfigData.data
            };

            await set(ref(db, `users/${user.uid}/settings/prescription/configurations/${configId}`), configToSave);

            // If it's the first one, make it default automatically
            if (configs.length === 0) {
                await set(ref(db, `users/${user.uid}/settings/prescription/defaultId`), configId);
                setDefaultConfigId(configId);
            }

            await loadData(user); // Reload
            setViewMode('list');

            Swal.fire({
                title: "Saved!",
                text: "Prescription configuration saved.",
                icon: "success",
                confirmButtonColor: "#007ACC"
            });
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    };

    const makeDefault = async (e: any, id: string) => {
        e.stopPropagation();
        if (!user) return;
        try {
            const db = getDatabase(app);
            await set(ref(db, `users/${user.uid}/settings/prescription/defaultId`), id);
            setDefaultConfigId(id);
            Swal.fire({
                title: "Updated!",
                text: "Default prescription set.",
                icon: "success",
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            console.error(error);
        }
    }

    const getHumanTemplateName = (techName: string) => {
        if (techName === "template_A") return "General";
        if (techName === "template_B") return "Gynecology";
        return techName;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#007ACC] border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex h-screen overflow-hidden">
            {viewMode === 'list' && (
                <div className="max-w-4xl mx-auto w-full p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <FiLayout className="text-[#007ACC]" /> Prescription Configurations
                            </h1>
                            <p className="text-slate-500">Manage your prescription layouts.</p>
                        </div>
                        <button onClick={createNewConfig} className="btn-primary">
                            + Create New
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {configs.map(config => (
                            <div key={config.id}
                                onClick={() => editConfig(config)}
                                className={`bg-white p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg group relative
                                ${defaultConfigId === config.id ? 'border-[#007ACC] ring-1 ring-blue-100' : 'border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${config.id === defaultConfigId ? 'bg-blue-50 text-[#007ACC]' : 'bg-slate-50 text-slate-500'}`}>
                                        <FiLayout size={24} />
                                    </div>
                                    {defaultConfigId === config.id ? (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Default</span>
                                    ) : (
                                        <button
                                            onClick={(e) => makeDefault(e, config.id)}
                                            className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">{config.name || "Untitled Config"}</h3>
                                <p className="text-sm text-slate-500">{getHumanTemplateName(config.template.name)} • {config.template.variant}</p>
                            </div>
                        ))}

                        {configs.length === 0 && (
                            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 mb-4">No configurations found.</p>
                                <button onClick={createNewConfig} className="text-[#007ACC] font-medium hover:underline">Create your first prescription layout</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'edit' && activeConfigData && (
                <div className="flex w-full h-full">
                    {/* Left Sidebar: Controls */}
                    <div className="w-[450px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-10">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                &larr;
                            </button>
                            <div>
                                <h1 className="font-bold text-slate-800">Edit Configuration</h1>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration Name</label>
                                <input
                                    type="text"
                                    value={activeConfigData.name}
                                    onChange={(e) => handleConfigNameChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#007ACC] outline-none font-medium"
                                    placeholder="e.g. My General Rx"
                                />
                            </div>

                            {/* Template Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Style</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {templates.map(t => (
                                        <button
                                            key={t.name}
                                            onClick={() => handleTemplateChange(t.name)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all relative
                                                ${activeConfigData.template.name === t.name
                                                    ? 'border-[#007ACC] bg-blue-50'
                                                    : 'border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <span className="font-bold text-slate-700 block">{getHumanTemplateName(t.name)}</span>
                                            {activeConfigData.template.name === t.name && <FiCheck className="absolute top-2 right-2 text-[#007ACC]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Variant Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color Theme</label>
                                <div className="flex flex-wrap gap-2">
                                    {['variant-1', 'variant-2', 'variant-3', 'variant-4', 'variant-5', 'variant-6', 'variant-7', 'variant-8', 'variant-9', 'variant-10'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => handleVariantChange(v)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                                                ${activeConfigData.template.variant === v ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border-white shadow-sm'}`}
                                            style={{ backgroundColor: getVariantColor(v) }}
                                            title={v}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Doctor Info Form */}
                            {activeConfigData.data && activeConfigData.data.doctor && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 pb-2">
                                        <FiUser className="text-[#007ACC]" />
                                        <h3 className="font-bold text-slate-700">Doctor Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InputGroup label="Name (English)" value={activeConfigData.data.doctor.name_en} onChange={(v) => handleDataChange('doctor', 'name_en', v)} />
                                        <InputGroup label="Degrees (English)" value={activeConfigData.data.doctor.degrees_en} onChange={(v) => handleDataChange('doctor', 'degrees_en', v)} textarea />
                                        <InputGroup label="Name (Bangla)" value={activeConfigData.data.doctor.name_bn} onChange={(v) => handleDataChange('doctor', 'name_bn', v)} />
                                        <InputGroup label="Degrees (Bangla)" value={activeConfigData.data.doctor.degrees_bn} onChange={(v) => handleDataChange('doctor', 'degrees_bn', v)} textarea />
                                    </div>
                                </div>
                            )}

                            {/* Chamber Info Form */}
                            {activeConfigData.data && activeConfigData.data.chember && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 pb-2">
                                        <FiHome className="text-[#007ACC]" />
                                        <h3 className="font-bold text-slate-700">Chamber Details</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InputGroup label="Chamber Name" value={activeConfigData.data.chember.name} onChange={(v) => handleDataChange('chember', 'name', v)} />
                                        <InputGroup label="Address" value={activeConfigData.data.chember.address} onChange={(v) => handleDataChange('chember', 'address', v)} />
                                        <InputGroup label="Mobile" value={activeConfigData.data.chember.mobile} onChange={(v) => handleDataChange('chember', 'mobile', v)} />
                                        <InputGroup label="Logo URL" value={activeConfigData.data.chember.logo_url} onChange={(v) => handleDataChange('chember', 'logo_url', v)} />
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <button
                                onClick={saveConfig}
                                disabled={saving}
                                className="w-full bg-[#007ACC] text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:bg-blue-600 transition flex items-center justify-center gap-2"
                            >
                                {saving ? <span className="animate-spin">⌛</span> : <FiSave />}
                                Save Configuration
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Preview */}
                    <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center h-full">
                        <div
                            className="bg-white shadow-2xl relative flex-shrink-0 origin-top transform scale-75 md:scale-90 lg:scale-100 transition-transform"
                            style={{ width: '794px', height: '1123px' }}
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function InputGroup({ label, value, onChange, textarea = false }: { label: string, value: string, onChange: (v: string) => void, textarea?: boolean }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
            {textarea ? (
                <textarea
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none h-20 resize-none font-sans"
                />
            ) : (
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#007ACC] focus:border-transparent outline-none font-sans"
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
