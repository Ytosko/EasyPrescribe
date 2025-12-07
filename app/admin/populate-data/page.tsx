"use client";

import { useState } from "react";
import { getDatabase, ref, set, push } from "firebase/database";
import { FiDatabase, FiCheck, FiAlertCircle } from "react-icons/fi";

const USER_ID = 'LyuetOPqwQW8irK6z75QR1pnPOy1';
const ASSISTANT_NAME = 'Rohim Uddin';

const firstNames = [
    'Abdul', 'Rahim', 'Karim', 'Salim', 'Nazim', 'Rashid', 'Kamrul', 'Jahangir', 'Habib', 'Moin',
    'Fatima', 'Ayesha', 'Rukhsana', 'Nasrin', 'Sultana', 'Rehana', 'Shamima', 'Taslima', 'Monira', 'Sabina',
    'Hasan', 'Hussain', 'Ali', 'Omar', 'Imran', 'Faisal', 'Tanvir', 'Shakil', 'Rafiq', 'Masum',
    'Khadija', 'Marium', 'Laila', 'Sadia', 'Nadia', 'Rafia', 'Shirin', 'Halima', 'Amina', 'Zainab',
    'Jakir', 'Jewel', 'Liton', 'Rubel', 'Sumon', 'Tarek', 'Arif', 'Masud', 'Rashed', 'Shahin'
];

const lastNames = [
    'Ahmed', 'Khan', 'Rahman', 'Islam', 'Hossain', 'Ali', 'Uddin', 'Begum', 'Akter', 'Khatun',
    'Chowdhury', 'Miah', 'Sarkar', 'Mondal', 'Das', 'Biswas', 'Roy', 'Nath', 'Barua', 'Saha'
];

const areas = [
    'Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Mohammadpur', 'Tejgaon', 'Badda',
    'Rampura', 'Khilgaon', 'Malibagh', 'Segunbagicha', 'Eskaton', 'Farmgate', 'Kawran Bazar',
    'Mohakhali', 'Bashundhara', 'Baridhara', 'Niketon', 'Lalmatia'
];

function getRandomItem(array: string[]) {
    return array[Math.floor(Math.random() * array.length)];
}

function generatePhone() {
    const prefix = ['013', '014', '015', '016', '017', '018', '019'];
    return getRandomItem(prefix) + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

function generatePatient() {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const name = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const age = Math.floor(Math.random() * 70) + 10;
    const sex = Math.random() > 0.5 ? 'Male' : 'Female';
    const address = `${Math.floor(Math.random() * 100) + 1}, ${getRandomItem(areas)}, Dhaka`;

    return { name, phone, age, sex, address, nextVisit: null, lastVisit: null };
}

export default function PopulateDataPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const addStatus = (message: string) => {
        setStatus(prev => [...prev, message]);
    };

    const populateData = async () => {
        setLoading(true);
        setError("");
        setSuccess(false);
        setStatus([]);

        try {
            const db = getDatabase();

            addStatus("🚀 Starting data population...");

            // Create 50 patients
            addStatus("📝 Creating 50 patients...");
            const patients = [];

            for (let i = 0; i < 50; i++) {
                const patient = generatePatient();
                patients.push(patient);

                const patientRef = ref(db, `users/${USER_ID}/patients/${patient.phone}`);
                await set(patientRef, patient);

                if ((i + 1) % 10 === 0) {
                    addStatus(`   ✓ Created ${i + 1} patients`);
                }
            }
            addStatus("✅ 50 patients created!");

            // Create 100 appointments
            addStatus("📅 Creating 100 appointments (Dec 6-10, 2025)...");

            const dates = ['2025-12-06', '2025-12-07', '2025-12-08', '2025-12-09', '2025-12-10'];
            const appointmentsPerDay = 20;
            let totalCreated = 0;

            for (const date of dates) {
                addStatus(`   Creating appointments for ${date}...`);

                for (let order = 1; order <= appointmentsPerDay; order++) {
                    const patient = patients[Math.floor(Math.random() * patients.length)];

                    const appointment = {
                        name: patient.name,
                        phone: patient.phone,
                        age: patient.age.toString(),
                        sex: patient.sex,
                        address: patient.address,
                        order: order,
                        createdBy: 'rohim_assistant_id',
                        createdByName: ASSISTANT_NAME,
                        createdAt: Date.now() - Math.floor(Math.random() * 86400000)
                    };

                    const apptRef = push(ref(db, `users/${USER_ID}/appointments/${date}`));
                    await set(apptRef, appointment);

                    const activityRef = push(ref(db, `users/${USER_ID}/activities`));
                    await set(activityRef, {
                        type: 'appointment_created',
                        timestamp: appointment.createdAt,
                        data: {
                            appointmentDate: date,
                            patientName: patient.name,
                            createdBy: ASSISTANT_NAME
                        }
                    });

                    totalCreated++;
                }

                addStatus(`   ✓ Created ${appointmentsPerDay} appointments for ${date}`);
            }

            addStatus(`✅ ${totalCreated} appointments created!`);
            addStatus("🎉 All done!");
            addStatus(`   • 50 patients created`);
            addStatus(`   • 100 appointments created (Dec 6-10, 2025)`);
            addStatus(`   • All attributed to: ${ASSISTANT_NAME}`);
            addStatus(`   • User ID: ${USER_ID}`);

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to populate data");
            addStatus(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#007ACC] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                            <FiDatabase size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Populate Dummy Data</h1>
                        <p className="text-slate-600">Generate 50 patients and 100 appointments for testing</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-blue-900 mb-2">What will be created:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• 50 patients with Bangladeshi names and Dhaka addresses</li>
                            <li>• 100 appointments distributed across Dec 6-10, 2025 (20 per day)</li>
                            <li>• All appointments attributed to: <strong>Rohim Uddin</strong></li>
                            <li>• User ID: <strong>{USER_ID}</strong></li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-800">
                            <FiAlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-emerald-800">
                            <FiCheck size={20} />
                            <span>Data populated successfully!</span>
                        </div>
                    )}

                    <button
                        onClick={populateData}
                        disabled={loading}
                        className="w-full btn-primary h-14 text-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-3">
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Populating Data...
                            </span>
                        ) : (
                            "🚀 Populate Data"
                        )}
                    </button>

                    {status.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-3">Status Log:</h3>
                            <div className="space-y-1 font-mono text-sm text-slate-700 max-h-96 overflow-y-auto">
                                {status.map((msg, idx) => (
                                    <div key={idx}>{msg}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
