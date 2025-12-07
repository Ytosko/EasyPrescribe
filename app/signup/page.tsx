"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { FcGoogle } from "react-icons/fc";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

export default function SignupPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update display name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Save user data to Realtime Database
            const { ref, set } = await import("firebase/database");
            const { database } = await import("@/lib/firebase");
            const userRef = ref(database, 'users/' + userCredential.user.uid);
            await set(userRef, {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });

            router.push("/dashboard");
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);

            // Check if user exists, if not save data
            const { ref, get, set } = await import("firebase/database");
            const { database } = await import("@/lib/firebase");
            const userRef = ref(database, 'users/' + result.user.uid);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                await set(userRef, {
                    uid: result.user.uid,
                    name: result.user.displayName || "Unknown",
                    email: result.user.email || "",
                    createdAt: new Date().toISOString()
                });
            }

            router.push("/dashboard");
        } catch (err: any) {
            setError("Failed to sign up with Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-30 animate-float"></div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block text-2xl font-bold text-[#007ACC] mb-2 hover:opacity-80 transition-opacity">
                        Easy Prescribe
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
                    <p className="text-slate-500 mt-2">Join thousands of doctors today</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-fade-in">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <MaterialInput
                        id="name"
                        type="text"
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<FiUser size={18} />}
                        required
                    />

                    <MaterialInput
                        id="email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<FiMail size={18} />}
                        required
                    />

                    <MaterialInput
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<FiLock size={18} />}
                        required
                        minLength={6}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary group mt-4 h-12"
                    >
                        {loading ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">Create Account <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></span>
                        )}
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-slate-400 text-sm">or sign up with</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-700 font-medium h-12"
                >
                    <FcGoogle size={24} />
                    <span>Google</span>
                </button>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#007ACC] font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
