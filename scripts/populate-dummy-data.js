// Script to populate dummy data for testing
// Run with: node scripts/populate-dummy-data.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');

// Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const USER_ID = 'LyuetOPqwQW8irK6z75QR1pnPOy1';
const ASSISTANT_NAME = 'Rohim Uddin';

// Bangladeshi names
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

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generatePhone() {
    const prefix = ['013', '014', '015', '016', '017', '018', '019'];
    return getRandomItem(prefix) + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

function generateAge() {
    return Math.floor(Math.random() * 70) + 10; // Age between 10-80
}

function generatePatient() {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const name = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const age = generateAge();
    const sex = Math.random() > 0.5 ? 'Male' : 'Female';
    const address = `${Math.floor(Math.random() * 100) + 1}, ${getRandomItem(areas)}, Dhaka`;

    return {
        name,
        phone,
        age,
        sex,
        address,
        nextVisit: null,
        lastVisit: null
    };
}

async function createDummyData() {
    console.log('🚀 Starting dummy data creation...\n');

    // Step 1: Create 50 patients
    console.log('📝 Creating 50 patients...');
    const patients = [];
    const patientPhones = [];

    for (let i = 0; i < 50; i++) {
        const patient = generatePatient();
        patients.push(patient);
        patientPhones.push(patient.phone);

        // Save to database
        const patientRef = ref(db, `users/${USER_ID}/patients/${patient.phone}`);
        await set(patientRef, patient);

        if ((i + 1) % 10 === 0) {
            console.log(`   ✓ Created ${i + 1} patients`);
        }
    }
    console.log('✅ 50 patients created!\n');

    // Step 2: Create 100 appointments across Dec 6-10, 2025
    console.log('📅 Creating 100 appointments (Dec 6-10, 2025)...');

    const dates = [
        '2025-12-06',
        '2025-12-07',
        '2025-12-08',
        '2025-12-09',
        '2025-12-10'
    ];

    const appointmentsPerDay = 20; // 100 appointments / 5 days
    let totalCreated = 0;

    for (const date of dates) {
        console.log(`   Creating appointments for ${date}...`);

        for (let order = 1; order <= appointmentsPerDay; order++) {
            // Pick a random patient
            const randomPatientIndex = Math.floor(Math.random() * patients.length);
            const patient = patients[randomPatientIndex];

            const appointment = {
                name: patient.name,
                phone: patient.phone,
                age: patient.age.toString(),
                sex: patient.sex,
                address: patient.address,
                order: order,
                createdBy: 'assistant_id_placeholder', // You can update this to actual assistant ID
                createdByName: ASSISTANT_NAME,
                createdAt: Date.now() - Math.floor(Math.random() * 86400000) // Random time in last 24 hours
            };

            // Save appointment
            const apptRef = push(ref(db, `users/${USER_ID}/appointments/${date}`));
            await set(apptRef, appointment);

            // Log activity
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

        console.log(`   ✓ Created ${appointmentsPerDay} appointments for ${date}`);
    }

    console.log(`✅ ${totalCreated} appointments created!\n`);

    console.log('🎉 All done! Summary:');
    console.log(`   • 50 patients created`);
    console.log(`   • 100 appointments created (Dec 6-10, 2025)`);
    console.log(`   • All attributed to: ${ASSISTANT_NAME}`);
    console.log(`   • User ID: ${USER_ID}`);
}

// Run the script
createDummyData()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
