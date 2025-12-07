"use client";

import { useState } from "react";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { BengaliInput } from "@/components/ui/BengaliInput";
import { FiPlus, FiTrash2, FiCheck, FiGlobe, FiFacebook, FiLinkedin, FiTwitter, FiClock, FiEdit3 } from "react-icons/fi";
import { clsx } from "clsx";

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const QuillWrapper = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-40 bg-slate-50 border rounded animate-pulse"></div>
});

export interface ProfileData {
    personal: {
        name: { en: string; bn: string };
        degrees: { en: string; bn: string };
        speciality: { en: string; bn: string };
        education: { en: string; bn: string };
        appointmentContact: { en: string; bn: string };
    };
    affiliations: Array<{
        title: { en: string; bn: string };
        institute: { en: string; bn: string };
    }>;
    chamber: {
        name: { en: string; bn: string };
        address: { en: string; bn: string };
        room: { en: string; bn: string };
        floor: { en: string; bn: string };
        time: { en: string; bn: string };
        contact: { en: string; bn: string };
    };
    about?: { en: string; bn: string };
    website?: string;
    experience?: string;
    socials?: {
        facebook?: string;
        linkedin?: string;
        twitter?: string;
    };
    onboardingCompleted?: boolean;
}

interface ProfileFormProps {
    initialData?: ProfileData;
    onSubmit: (data: ProfileData) => Promise<void>;
    loading?: boolean;
    buttonLabel?: string;
}

const initialProfileState: ProfileData = {
    personal: {
        name: { en: "", bn: "" },
        degrees: { en: "", bn: "" },
        speciality: { en: "", bn: "" },
        education: { en: "", bn: "" },
        appointmentContact: { en: "", bn: "" }
    },
    affiliations: [{
        title: { en: "", bn: "" },
        institute: { en: "", bn: "" }
    }],
    chamber: {
        name: { en: "", bn: "" },
        address: { en: "", bn: "" },
        room: { en: "", bn: "" },
        floor: { en: "", bn: "" },
        time: { en: "", bn: "" },
        contact: { en: "", bn: "" }
    },
    about: { en: "", bn: "" },
    website: "",
    experience: "",
    socials: {
        facebook: "",
        linkedin: "",
        twitter: ""
    }
};

export function ProfileForm({ initialData, onSubmit, loading, buttonLabel = "Save Profile" }: ProfileFormProps) {
    const [data, setData] = useState<ProfileData>(() => {
        // Safe merge of initialData with defaults
        const base = initialData || initialProfileState;
        return {
            ...base,
            personal: {
                ...initialProfileState.personal, // start with all default fields
                ...(base.personal || {}), // override with existing values
                // explicitly ensure nested objects exist if they were partially missing (though specific fields should be covered by spread above, deeper nesting like 'name' object structure is assumed consistent or we accept overwrite)
                // However, for 'degrees', if it's missing in base.personal, the spread ...initialProfileState.personal provided it.
                // BUT, if base.personal existed but lacked degrees, the spread `...(base.personal || {})` would NOT add degrees if it wasn't there? 
                // Wait, spread `...base.personal` puts the properties of base.personal onto the accumulator.
                // If I do `{ ...default, ...existing }`:
                // default has degrees. existing does NOT.
                // existing does NOT have key 'degrees', so it does NOT overwrite default's 'degrees'.
                // So `{ ...initialProfileState.personal, ...base.personal }` SHOULD work.

                // Let's be explicit to be safe:
                degrees: base.personal?.degrees || { en: "", bn: "" },
            },
            about: base.about || { en: "", bn: "" },
            socials: base.socials || { facebook: "", linkedin: "", twitter: "" }
        };
    });
    const [activeTab, setActiveTab] = useState<"myInfo" | "chamber" | "additional">("myInfo");
    const [langTab, setLangTab] = useState<"en" | "bn">("en");

    const updatePersonalLang = (field: "name" | "degrees" | "speciality" | "education" | "appointmentContact", value: string) => {
        setData((prev) => ({
            ...prev,
            personal: {
                ...prev.personal,
                [field]: { ...prev.personal[field], [langTab]: value }
            }
        }));
    };

    const updateChamberLang = (field: "name" | "time" | "address" | "room" | "floor" | "contact", value: string) => {
        setData((prev) => ({
            ...prev,
            chamber: {
                ...prev.chamber,
                [field]: { ...prev.chamber[field], [langTab]: value }
            }
        }));
    };

    const addAffiliation = () => {
        setData((prev) => ({
            ...prev,
            affiliations: [...prev.affiliations, {
                title: { en: "", bn: "" },
                institute: { en: "", bn: "" }
            }]
        }));
    };

    const removeAffiliation = (index: number) => {
        setData((prev) => ({
            ...prev,
            affiliations: prev.affiliations.filter((_, i) => i !== index)
        }));
    };

    const updateAffiliation = (index: number, field: "title" | "institute", value: string) => {
        const newAffiliations = [...data.affiliations];
        newAffiliations[index] = {
            ...newAffiliations[index],
            [field]: { ...newAffiliations[index][field], [langTab]: value }
        };
        setData((prev) => ({ ...prev, affiliations: newAffiliations }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Main Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    type="button"
                    className={clsx("flex-1 py-4 text-center font-semibold transition-colors", activeTab === "myInfo" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50")}
                    onClick={() => setActiveTab("myInfo")}
                >
                    1. My Info
                </button>
                <button
                    type="button"
                    className={clsx("flex-1 py-4 text-center font-semibold transition-colors", activeTab === "chamber" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50")}
                    onClick={() => setActiveTab("chamber")}
                >
                    2. Chamber Info
                </button>
                <button
                    type="button"
                    className={clsx("flex-1 py-4 text-center font-semibold transition-colors", activeTab === "additional" ? "bg-blue-50 text-[#007ACC] border-b-2 border-[#007ACC]" : "text-slate-500 hover:bg-slate-50")}
                    onClick={() => setActiveTab("additional")}
                >
                    3. Additional Info
                </button>
            </div>

            <div className="p-6">
                {/* Language Tabs (Nested) */}
                <div className="flex justify-end mb-6">
                    <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                        <button
                            type="button"
                            className={clsx("px-4 py-1.5 rounded-md text-sm font-medium transition-all", langTab === "en" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            onClick={() => setLangTab("en")}
                        >
                            English
                        </button>
                        <button
                            type="button"
                            className={clsx("px-4 py-1.5 rounded-md text-sm font-medium transition-all", langTab === "bn" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            onClick={() => setLangTab("bn")}
                        >
                            বাংলা (Bengali)
                        </button>
                    </div>
                </div>

                {activeTab === "myInfo" && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Name and Speciality */}
                        {langTab === 'bn' ? (
                            <>
                                <BengaliInput
                                    label="Name on Prescription (Bengali)"
                                    value={data.personal.name.bn}
                                    onChangeText={(text) => updatePersonalLang("name", text)}
                                    id="name-bn"
                                />
                                <BengaliInput
                                    label="Degrees (Bengali)"
                                    value={data.personal.degrees.bn}
                                    onChangeText={(text) => updatePersonalLang("degrees", text)}
                                    id="degrees-bn"
                                />
                                <BengaliInput
                                    label="Designations / Speciality (Bengali)"
                                    value={data.personal.speciality.bn}
                                    onChangeText={(text) => updatePersonalLang("speciality", text)}
                                    id="spec-bn"
                                />
                            </>
                        ) : (
                            <>
                                <MaterialInput
                                    label="Name on Prescription (English)"
                                    value={data.personal.name.en}
                                    onChange={(e) => updatePersonalLang("name", e.target.value)}
                                    id="name-en"
                                />
                                <MaterialInput
                                    label="Degrees (English)"
                                    value={data.personal.degrees.en}
                                    onChange={(e) => updatePersonalLang("degrees", e.target.value)}
                                    id="degrees-en"
                                />
                                <MaterialInput
                                    label="Designations / Speciality (English)"
                                    value={data.personal.speciality.en}
                                    onChange={(e) => updatePersonalLang("speciality", e.target.value)}
                                    id="spec-en"
                                />
                            </>
                        )}

                        {/* Affiliations */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Affiliations</label>
                            {data.affiliations.map((aff, index) => (
                                <div key={index} className="flex gap-2 mb-3 items-start">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {langTab === 'bn' ? (
                                            <>
                                                {/* We cannot easily put BengaliInput inside the existing grid if its styled differently, 
                                                    but BengaliInput has similar style to MaterialInput, so it should fit 
                                                */}
                                                <BengaliInput
                                                    label="Designation (e.g. Consultant)"
                                                    value={aff.title.bn}
                                                    onChangeText={(text) => updateAffiliation(index, "title", text)}
                                                    id={`aff-title-bn-${index}`}
                                                    className="mb-0" // Override margin for grid
                                                />
                                                <BengaliInput
                                                    label="Institute / Hospital"
                                                    value={aff.institute.bn}
                                                    onChangeText={(text) => updateAffiliation(index, "institute", text)}
                                                    id={`aff-inst-bn-${index}`}
                                                    className="mb-0"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <MaterialInput
                                                    label="Designation (e.g. Consultant)"
                                                    value={aff.title.en}
                                                    onChange={(e) => updateAffiliation(index, "title", e.target.value)}
                                                    id={`aff-title-en-${index}`}
                                                />
                                                <MaterialInput
                                                    label="Institute / Hospital"
                                                    value={aff.institute.en}
                                                    onChange={(e) => updateAffiliation(index, "institute", e.target.value)}
                                                    id={`aff-inst-en-${index}`}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeAffiliation(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-1">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addAffiliation} className="text-sm font-medium text-[#007ACC] flex items-center gap-1 mt-2 hover:underline">
                                <FiPlus /> Add Affiliation
                            </button>
                        </div>

                        {/* Education (Shared -> Now Bilingual) */}
                        {langTab === 'bn' ? (
                            <BengaliInput
                                label="Educational Institute (Bengali)"
                                value={data.personal.education.bn}
                                onChangeText={(text) => updatePersonalLang("education", text)}
                                id="edu-bn"
                            />
                        ) : (
                            <MaterialInput
                                label="Educational Institute (English)"
                                value={data.personal.education.en}
                                onChange={(e) => updatePersonalLang("education", e.target.value)}
                                id="edu-en"
                            />
                        )}

                        {/* Appointment Contact */}
                        {langTab === 'bn' ? (
                            <BengaliInput
                                label="Contact Number for Appointments (Bengali)"
                                value={data.personal.appointmentContact.bn}
                                onChangeText={(text) => updatePersonalLang("appointmentContact", text)}
                                id="appt-bn"
                            />
                        ) : (
                            <MaterialInput
                                label="Contact Number for Appointments (English)"
                                value={data.personal.appointmentContact.en}
                                onChange={(e) => updatePersonalLang("appointmentContact", e.target.value)}
                                id="appt-en"
                            />
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab("chamber")}
                                className="text-[#007ACC] font-medium hover:underline"
                            >
                                Next Step &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "chamber" && (
                    <div className="space-y-6 animate-fade-in">
                        {langTab === 'bn' ? (
                            <>
                                <BengaliInput
                                    label="Chamber Name (Bengali)"
                                    value={data.chamber.name.bn}
                                    onChangeText={(text) => updateChamberLang("name", text)}
                                    id="cname-bn"
                                />
                                <BengaliInput
                                    label="Chamber Address (Bengali)"
                                    value={data.chamber.address.bn}
                                    onChangeText={(text) => updateChamberLang("address", text)}
                                    id="caddr-bn"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <BengaliInput
                                        label="Room Number (Bengali)"
                                        value={data.chamber.room.bn}
                                        onChangeText={(text) => updateChamberLang("room", text)}
                                        id="croom-bn"
                                        className="mb-0" // Remove bottom margin for grid alignment
                                    />
                                    <BengaliInput
                                        label="Floor (Bengali)"
                                        value={data.chamber.floor.bn}
                                        onChangeText={(text) => updateChamberLang("floor", text)}
                                        id="cfloor-bn"
                                        className="mb-0"
                                    />
                                </div>
                                <BengaliInput
                                    label="Time and Days (Bengali)"
                                    value={data.chamber.time.bn}
                                    onChangeText={(text) => updateChamberLang("time", text)}
                                    id="ctime-bn"
                                />
                                <BengaliInput
                                    label="Chamber Contact Number (Bengali)"
                                    value={data.chamber.contact.bn}
                                    onChangeText={(text) => updateChamberLang("contact", text)}
                                    id="ccontact-bn"
                                />
                            </>
                        ) : (
                            <>
                                <MaterialInput
                                    label="Chamber Name (English)"
                                    value={data.chamber.name.en}
                                    onChange={(e) => updateChamberLang("name", e.target.value)}
                                    id="cname-en"
                                />
                                <MaterialInput
                                    label="Chamber Address (English)"
                                    value={data.chamber.address.en}
                                    onChange={(e) => updateChamberLang("address", e.target.value)}
                                    id="caddr-en"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <MaterialInput
                                        label="Room Number (English)"
                                        value={data.chamber.room.en}
                                        onChange={(e) => updateChamberLang("room", e.target.value)}
                                        id="croom-en"
                                    />
                                    <MaterialInput
                                        label="Floor (English)"
                                        value={data.chamber.floor.en}
                                        onChange={(e) => updateChamberLang("floor", e.target.value)}
                                        id="cfloor-en"
                                    />
                                </div>
                                <MaterialInput
                                    label="Time and Days (English)"
                                    value={data.chamber.time.en}
                                    onChange={(e) => updateChamberLang("time", e.target.value)}
                                    id="ctime-en"
                                />
                                <MaterialInput
                                    label="Chamber Contact Number (English)"
                                    value={data.chamber.contact.en}
                                    onChange={(e) => updateChamberLang("contact", e.target.value)}
                                    id="ccontact-en"
                                />
                            </>
                        )}
                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab("additional")}
                                className="text-[#007ACC] font-medium hover:underline"
                            >
                                Next Step &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "additional" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h4 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
                                Enhanced Profile Info (English Only)
                            </h4>
                            <p className="text-sm text-slate-500 mb-6">These details will be shown on your public profile. This section does not support Bengali translation.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">About Me</label>
                                    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden pb-10">
                                        <QuillWrapper
                                            theme="snow"
                                            value={data.about?.en || ""}
                                            onChange={(val: string) => setData(prev => ({ ...prev, about: { ...prev.about!, en: val } }))}
                                            className="h-40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                    <MaterialInput
                                        label="Years of Experience"
                                        value={data.experience || ""}
                                        onChange={(e) => setData(prev => ({ ...prev, experience: e.target.value }))}
                                        id="exp"
                                        icon={<FiClock className="text-slate-400" />}
                                    />
                                    <MaterialInput
                                        label="Personal Website"
                                        value={data.website || ""}
                                        onChange={(e) => setData(prev => ({ ...prev, website: e.target.value }))}
                                        id="website"
                                        icon={<FiGlobe className="text-slate-400" />}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-slate-700">Social Links</label>
                                    <MaterialInput
                                        label="Facebook URL"
                                        value={data.socials?.facebook || ""}
                                        onChange={(e) => setData(prev => ({ ...prev, socials: { ...prev.socials, facebook: e.target.value } }))}
                                        id="facebook"
                                        icon={<FiFacebook className="text-slate-400" />}
                                    />
                                    <MaterialInput
                                        label="LinkedIn URL"
                                        value={data.socials?.linkedin || ""}
                                        onChange={(e) => setData(prev => ({ ...prev, socials: { ...prev.socials, linkedin: e.target.value } }))}
                                        id="linkedin"
                                        icon={<FiLinkedin className="text-slate-400" />}
                                    />
                                    <MaterialInput
                                        label="Twitter/X URL"
                                        value={data.socials?.twitter || ""}
                                        onChange={(e) => setData(prev => ({ ...prev, socials: { ...prev.socials, twitter: e.target.value } }))}
                                        id="twitter"
                                        icon={<FiTwitter className="text-slate-400" />}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary min-w-[200px]"
                            >
                                {loading ? "Saving..." : <><FiCheck className="mr-2" /> {buttonLabel}</>}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </form>
    );
}


