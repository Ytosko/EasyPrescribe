"use client";

import { useState, useEffect } from "react";
import { getDatabase, ref, push, set, onValue, remove, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { MaterialInput } from "@/components/ui/MaterialInput";
import { FiPlus, FiTrash2, FiUser, FiEdit2, FiX, FiCheck } from "react-icons/fi";

interface Assistant {
    id: string;
    name: string;
    phone: string;
    username: string;
    password: string;
}

export default function AssistantManager() {
    const { user } = useAuth();
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", phone: "", username: "", password: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const db = getDatabase();
        const assistantsRef = ref(db, `users/${user.uid}/assistants`);

        const unsubscribe = onValue(assistantsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                setAssistants(list);
            } else {
                setAssistants([]);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const db = getDatabase();
            if (editingId) {
                await update(ref(db, `users/${user.uid}/assistants/${editingId}`), formData);
                setEditingId(null);
            } else {
                const newRef = push(ref(db, `users/${user.uid}/assistants`));
                await set(newRef, formData);
                setIsCreating(false);
            }
            setFormData({ name: "", phone: "", username: "", password: "" });
        } catch (error) {
            console.error("Error saving assistant:", error);
            alert("Failed to save assistant.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assistant: Assistant) => {
        setFormData({
            name: assistant.name,
            phone: assistant.phone,
            username: assistant.username,
            password: assistant.password
        });
        setEditingId(assistant.id);
        setIsCreating(true); // Reuse the created form/modal space if preferred, or just scroll to it
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({ name: "", phone: "", username: "", password: "" });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this assistant?")) return;
        if (!user) return;

        const db = getDatabase();
        await remove(ref(db, `users/${user.uid}/assistants/${id}`));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">My Assistants</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage accounts for your assistants who handle appointments.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <FiPlus size={20} /> Add New Assistant
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-fade-in shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#007ACC]"></div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-between text-lg">
                        {editingId ? "Edit Assistant Details" : "Create New Assistant Account"}
                        <button onClick={handleCancel} className="text-slate-400 hover:text-red-500 transition-colors" title="Cancel"><FiX size={24} /></button>
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Fill in the details below to give your assistant access to the appointment portal.
                        They will need the <strong>username</strong> and <strong>password</strong> to log in.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MaterialInput
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Rohim Uddin"
                            />
                            <MaterialInput
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                placeholder="e.g. 017..."
                            />
                        </div>
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2"><FiUser /> Login Credentials</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MaterialInput
                                    label="Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    placeholder="Unique login ID"
                                    inputClassName="bg-white"
                                />
                                <MaterialInput
                                    label="Password"
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Simple password"
                                    inputClassName="bg-white"
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                * Share these credentials with your assistant securely.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 bg-[#007ACC] text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-blue-200"
                            >
                                {loading ? "Saving..." : editingId ? <><FiCheck /> Update Accountant</> : <><FiPlus /> Create Account</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assistants.map((assistant) => (
                    <div key={assistant.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-[#007ACC] rounded-full flex items-center justify-center">
                                <FiUser size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{assistant.name}</h3>
                                <p className="text-sm text-slate-500">{assistant.phone}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Username:</span>
                                <span className="font-medium text-slate-800">{assistant.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Password:</span>
                                <span className="font-mono text-slate-800">{assistant.password}</span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(assistant)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                            >
                                <FiEdit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(assistant.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {assistants.length === 0 && !isCreating && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    <p>No assistants added yet.</p>
                    <button onClick={() => setIsCreating(true)} className="text-[#007ACC] hover:underline mt-2">Add your first assistant</button>
                </div>
            )}
        </div>
    );
}
