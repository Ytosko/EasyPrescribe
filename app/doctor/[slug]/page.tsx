"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDatabase, ref, get } from "firebase/database";
import { FiPhone, FiMapPin, FiClock, FiUser, FiInfo, FiAward, FiGlobe, FiFacebook, FiLinkedin, FiTwitter } from "react-icons/fi";
import { clsx } from "clsx";

export default function DoctorLandingPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [doctorUid, setDoctorUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [landingSettings, setLandingSettings] = useState<any>(null);
    const [bookingNumbers, setBookingNumbers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 1. Get UID from Slug
    useEffect(() => {
        if (!slug) return;

        // Immediate Validation to prevent Firebase path errors
        if (!/^[a-z0-9-]+$/.test(slug)) {
            setError("Invalid page address.");
            setLoading(false);
            return;
        }

        const fetchUid = async () => {
            const db = getDatabase();
            const slugRef = ref(db, `doctor_slugs/${slug}`);
            const snapshot = await get(slugRef);
            if (snapshot.exists()) {
                setDoctorUid(snapshot.val());
            } else {
                setError("Doctor not found.");
                setLoading(false);
            }
        };
        fetchUid();
    }, [slug]);

    // 2. Fetch Data
    useEffect(() => {
        if (!doctorUid) return;
        const fetchData = async () => {
            const db = getDatabase();

            // Parallel fetch for speed
            const [profileSnap, landingSnap, assistantsSnap] = await Promise.all([
                get(ref(db, `users/${doctorUid}/profile`)),
                get(ref(db, `users/${doctorUid}/landingSettings`)),
                get(ref(db, `users/${doctorUid}/assistants`))
            ]);

            if (profileSnap.exists()) setProfile(profileSnap.val());

            let currentNumbers: string[] = [];
            let theme = "#007ACC";

            if (landingSnap.exists()) {
                const ls = landingSnap.val();
                setLandingSettings(ls);
                theme = ls.themeColor || theme;

                if (ls.bookingNumbers) {
                    currentNumbers = [...ls.bookingNumbers];
                }

                if (ls.isActive === false) {
                    router.replace('/404');
                    return;
                }

                if (ls.showAssistantNumbers && assistantsSnap.exists()) {
                    const assistants = assistantsSnap.val();
                    Object.values(assistants).forEach((a: any) => {
                        if (a.phone) currentNumbers.push(a.phone);
                    });
                }
            } else {
                // Fallback if no settings? maybe use profile contact
                if (profileSnap.exists()) {
                    // Fallback logic could go here
                }
            }

            // Remove duplicates and empty
            setBookingNumbers([...new Set(currentNumbers.filter(n => n && n.trim() !== ""))]);
            setLoading(false);
        };
        fetchData();
    }, [doctorUid]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen flex items-center justify-center text-slate-500">
            <p>{error || "Profile incomplete."}</p>
        </div>
    );

    // Helpers
    const t = (obj: any) => {
        if (!obj) return "";
        if (typeof obj === 'string') return obj;
        return obj.en || Object.values(obj)[0] || ""; // Default to English or first avail
    };

    const themeColor = landingSettings?.themeColor || "#007ACC";

    return (
        <div style={{ '--theme-color': themeColor } as React.CSSProperties} className="font-sans text-slate-800">
            {/* Hero Section */}
            <div className="bg-[var(--theme-color)] text-white pt-20 pb-16 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/20 backdrop-blur-sm p-1 flex-shrink-0 border-4 border-white/50 shadow-xl overflow-hidden">
                        {landingSettings?.profileImageDetails ? (
                            <img src={landingSettings.profileImageDetails} alt="Doctor" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-5xl">
                                <FiUser />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">
                            {t(profile.personal.name)}
                            {t(profile.personal.degrees) && (
                                <span className="text-xl md:text-3xl opacity-80 font-normal ml-3 block md:inline border-t md:border-t-0 md:border-l border-white/30 pt-2 md:pt-0 md:pl-4 mt-2 md:mt-0">
                                    {t(profile.personal.degrees)}
                                </span>
                            )}
                        </h1>
                        <p className="text-xl md:text-2xl opacity-90 font-light mt-2">{t(profile.personal.speciality)}</p>
                        {landingSettings?.topAffiliation && (
                            <p className="text-md md:text-lg text-blue-100 font-medium mt-1">{landingSettings.topAffiliation}</p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-6">
                            {/* Socials */}
                            {(profile.socials || profile.website) && (
                                <div className="flex gap-4 items-center mr-4 border-r border-white/20 pr-4">
                                    {profile.website && (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition bg-white/10 p-2 rounded-full"><FiGlobe size={20} /></a>
                                    )}
                                    {profile.socials?.facebook && (
                                        <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition bg-white/10 p-2 rounded-full"><FiFacebook size={20} /></a>
                                    )}
                                    {profile.socials?.linkedin && (
                                        <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition bg-white/10 p-2 rounded-full"><FiLinkedin size={20} /></a>
                                    )}
                                    {profile.socials?.twitter && (
                                        <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition bg-white/10 p-2 rounded-full"><FiTwitter size={20} /></a>
                                    )}
                                </div>
                            )}

                            {bookingNumbers[0] && (
                                <a
                                    href={`tel:${bookingNumbers[0]}`}
                                    className="bg-white text-[var(--theme-color)] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-slate-50 transition transform hover:-translate-y-1 flex items-center gap-2"
                                >
                                    <FiPhone /> Book Appointment
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
                {/* Booking Numbers Section */}
                <section className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 -mt-20 relative z-20">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--theme-color)]">
                        <FiPhone /> Appointment Numbers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookingNumbers.length > 0 ? bookingNumbers.map((num, idx) => (
                            <a
                                key={idx}
                                href={`tel:${num}`}
                                className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)] hover:text-white transition group"
                            >
                                <FiPhone className="text-slate-400 group-hover:text-white" />
                                <span className="font-mono font-semibold text-lg">{num}</span>
                            </a>
                        )) : (
                            <p className="text-slate-500">No booking numbers listed.</p>
                        )}
                    </div>
                </section>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Education & Bio */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                            <span className="w-8 h-8 rounded-lg bg-[var(--theme-color)] text-white flex items-center justify-center text-sm"><FiUser /></span>
                            About Doctor
                        </h2>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            {profile.about && (t(profile.about)) && (
                                <div className="pb-4 border-b border-slate-200">
                                    <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">Biography</h3>
                                    <div
                                        className="text-slate-600 leading-relaxed prose prose-sm max-w-none prose-a:text-blue-600 prose-headings:font-semibold prose-ul:list-disc prose-ol:list-decimal"
                                        dangerouslySetInnerHTML={{ __html: t(profile.about) }}
                                    />
                                </div>
                            )}

                            {profile.experience && (
                                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm mb-4">
                                    <FiClock className="text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-700">{profile.experience} Experience</span>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-slate-700 mb-1 flex items-center gap-2"><FiAward className="text-[var(--theme-color)]" /> Education</h3>
                                <p className="text-slate-600 leading-relaxed">{t(profile.personal.education)}</p>
                            </div>
                            {(() => {
                                const topAff = landingSettings?.topAffiliation;
                                // Filter out the top affiliation if it exists
                                const filteredAffiliations = (profile.affiliations || []).filter((aff: any) => {
                                    const title = t(aff.title);
                                    const institute = t(aff.institute);
                                    // Reconstruct the label to match what is stored in LandingPageSettings
                                    const label = title ? `${title}${institute ? `, ${institute}` : ''}` : "";

                                    return !topAff || label !== topAff;
                                });

                                if (!filteredAffiliations.length) return null;

                                return (
                                    <div>
                                        <h3 className="font-semibold text-slate-700 mb-2 mt-4 flex items-center gap-2"><FiInfo className="text-[var(--theme-color)]" /> Experience</h3>
                                        <ul className="space-y-2">
                                            {filteredAffiliations.map((aff: any, idx: number) => (
                                                <li key={idx} className="text-sm text-slate-600">
                                                    <span className="font-medium text-slate-800 block">{t(aff.title)}</span>
                                                    {t(aff.institute)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Chamber Info - Conditional */}
                    {(landingSettings?.showChamber !== false) && (
                        <section>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <span className="w-8 h-8 rounded-lg bg-[var(--theme-color)] text-white flex items-center justify-center text-sm"><FiMapPin /></span>
                                Chamber
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">{t(profile.chamber.name)}</h3>
                                    <div className="flex gap-3 text-slate-600">
                                        <FiMapPin className="mt-1 flex-shrink-0 text-[var(--theme-color)]" />
                                        <div>
                                            <p>{t(profile.chamber.address)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-slate-600">
                                    <FiClock className="mt-1 flex-shrink-0 text-[var(--theme-color)]" />
                                    <div>
                                        <p className="font-medium text-slate-900">Visiting Hours</p>
                                        <p>{t(profile.chamber.time)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-slate-600 border-t border-slate-200 pt-4">
                                    <FiInfo className="mt-1 flex-shrink-0 text-[var(--theme-color)]" />
                                    <p className="text-sm">For appointments, please call the numbers listed above during visiting hours.</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <footer className="text-center text-slate-400 text-sm py-8 border-t border-slate-100">
                    <p>&copy; {new Date().getFullYear()} {t(profile.personal.name)}. Powered by Easy Prescribe.</p>
                </footer>
            </div>
        </div>
    );
}
