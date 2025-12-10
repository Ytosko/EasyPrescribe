"use client";

import { useAuth } from '@/context/AuthContext';
import { getDatabase, ref, get } from "firebase/database";
import { useEffect, useState } from 'react';
import { FiUsers, FiActivity, FiMapPin, FiPhone, FiClock, FiCalendar, FiGlobe, FiFacebook, FiLinkedin, FiTwitter, FiBriefcase, FiAward } from 'react-icons/fi';
import { clsx } from 'clsx';
import { ProfileData } from '@/components/onboarding/ProfileForm';

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [langTab, setLangTab] = useState<"en" | "bn">("en");
    const [profilePicture, setProfilePicture] = useState<string>("");

    const [stats, setStats] = useState({
        totalPatients: 0,
        patientsToday: 0,
        upcoming: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const db = getDatabase();

                // Fetch Profile
                const profileRef = ref(db, `users/${user.uid}/profile`);
                const profileSnap = await get(profileRef);
                if (profileSnap.exists()) setProfile(profileSnap.val());
                else setProfile(null);

                // Fetch Profile Picture from Landing Page Settings
                const landingRef = ref(db, `users/${user.uid}/landingSettings`);
                const landingSnap = await get(landingRef);
                if (landingSnap.exists() && landingSnap.val().profileImageDetails) {
                    setProfilePicture(landingSnap.val().profileImageDetails);
                }

                // Fetch Total Patients
                const patientsRef = ref(db, `users/${user.uid}/patients`);
                const patientsSnap = await get(patientsRef);
                const totalPatients = patientsSnap.exists() ? Object.keys(patientsSnap.val()).length : 0;

                // Fetch Appointment Stats 
                const apptRef = ref(db, `users/${user.uid}/appointments`);
                const apptSnap = await get(apptRef);

                let patientsToday = 0;
                let upcomingCount = 0;

                if (apptSnap.exists()) {
                    const data = apptSnap.val();
                    const todayStr = new Date().toISOString().split('T')[0];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    Object.entries(data).forEach(([dateStr, dayAppts]: [string, any]) => {
                        const apptDate = new Date(dateStr);
                        const appointments = Object.values(dayAppts) as any[];

                        if (dateStr === todayStr) {
                            patientsToday = appointments.length;
                        }

                        if (apptDate >= today) {
                            upcomingCount += appointments.length;
                        }
                    });
                }

                setStats({
                    totalPatients,
                    patientsToday,
                    upcoming: upcomingCount
                });
            }
            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#007ACC] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>No profile information found. Please complete your profile.</p>
            </div>
        );
    }

    const { personal, affiliations, chamber } = profile;

    const t = (obj: { en: string; bn: string } | string) => {
        if (!obj) return "";
        if (typeof obj === 'string') return obj;
        return obj[langTab] || obj['en'] || "";
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-4">
            {/* Compact Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
                <div className="bg-white border border-slate-200 p-1 rounded-lg inline-flex shadow-sm">
                    <button
                        onClick={() => setLangTab("en")}
                        className={clsx("px-3 py-1.5 rounded text-xs font-medium transition", langTab === "en" ? "bg-[#007ACC] text-white" : "text-slate-500")}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLangTab("bn")}
                        className={clsx("px-3 py-1.5 rounded text-xs font-medium transition", langTab === "bn" ? "bg-[#007ACC] text-white" : "text-slate-500")}
                    >
                        বাংলা
                    </button>
                </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                    <FiUsers size={20} className="mx-auto mb-1 text-[#007ACC]" />
                    <div className="text-2xl font-bold text-slate-900">{stats.totalPatients}</div>
                    <div className="text-xs text-slate-500">Total Patients</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                    <FiActivity size={20} className="mx-auto mb-1 text-emerald-600" />
                    <div className="text-2xl font-bold text-slate-900">{stats.patientsToday}</div>
                    <div className="text-xs text-slate-500">Today</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                    <FiCalendar size={20} className="mx-auto mb-1 text-purple-600" />
                    <div className="text-2xl font-bold text-slate-900">{stats.upcoming}</div>
                    <div className="text-xs text-slate-500">Upcoming</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profile Info - 2 cols */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
                    {/* Header */}
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-lg shadow flex items-center justify-center text-3xl border-2 border-white overflow-hidden">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span>👨‍⚕️</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-900">{t(personal.name)}</h2>
                            <p className="text-[#007ACC] font-medium text-sm">{t(personal.speciality)}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="bg-blue-100 text-[#007ACC] px-2 py-0.5 rounded text-xs font-bold">VERIFIED</span>
                                {profile.experience && (
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">{profile.experience}</span>
                                )}
                            </div>
                        </div>
                        {/* Social Links */}
                        {(profile.socials || profile.website) && (
                            <div className="flex gap-2">
                                {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-[#007ACC] transition"><FiGlobe size={14} /></a>}
                                {profile.socials?.facebook && <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 transition"><FiFacebook size={14} /></a>}
                                {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-blue-700 transition"><FiLinkedin size={14} /></a>}
                                {profile.socials?.twitter && <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-sky-500 transition"><FiTwitter size={14} /></a>}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-4">
                        {/* About */}
                        {profile.about && t(profile.about) && (
                            <div className="pb-4 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">About</h3>
                                <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t(profile.about) }} />
                            </div>
                        )}

                        {/* Education */}
                        <div className="pb-4 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Education</h3>
                            <p className="text-sm text-slate-700">{t(personal.education)}</p>
                        </div>

                        {/* Affiliations */}
                        {affiliations && affiliations.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Affiliations</h3>
                                <div className="space-y-2">
                                    {affiliations.map((aff, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <div className="w-1 bg-[#007ACC] rounded"></div>
                                            <div>
                                                <div className="font-semibold text-slate-900 text-sm">{t(aff.title)}</div>
                                                <div className="text-xs text-slate-500">{t(aff.institute)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chamber - 1 col */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Chamber</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="font-bold text-slate-900 text-sm mb-1">{t(chamber.name)}</div>
                            <div className="text-xs text-slate-600">{t(chamber.address)}</div>
                            {(chamber.room || chamber.floor) && (
                                <div className="text-xs text-slate-400 mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded">
                                    {chamber.room && `Room: ${t(chamber.room)}`}{chamber.floor && chamber.room && " • "}{chamber.floor && `Floor: ${t(chamber.floor)}`}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <FiClock size={14} className="text-[#007ACC]" />
                            <div className="text-xs text-slate-600">{t(chamber.time)}</div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <FiPhone size={14} className="text-[#007ACC]" />
                            <div className="text-xs font-mono text-slate-900">{t(chamber.contact)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
