import { Metadata, ResolvingMetadata } from 'next';
import DoctorLandingClient from '@/components/doctor/DoctorLandingClient';

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Helper to fetch data using REST API to avoid SDK initialization on server for now
async function fetchFirebaseData(path: string) {
    let dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

    // Fallback 1: Project ID from env
    if (!dbUrl && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        dbUrl = `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`;
    }

    // Fallback 2: Hardcoded Project ID (known from user context)
    if (!dbUrl) {
        dbUrl = "https://mentorism-a1d5d-default-rtdb.firebaseio.com";
        console.warn("DEBUG: Using hardcoded fallback DB URL:", dbUrl);
    }

    console.log("DEBUG: Fetching", path, "DB_URL:", dbUrl);

    if (!dbUrl) {
        console.error("DEBUG: CRITICAL - Could not determine Database URL");
        return null;
    }

    try {
        // Ensure URL doesn't double slash if dbUrl ends with /
        const baseUrl = dbUrl.endsWith('/') ? dbUrl.slice(0, -1) : dbUrl;
        const url = `${baseUrl}/${path}.json`;

        console.log("DEBUG: Full URL:", url);
        const res = await fetch(url, { next: { revalidate: 0 } }); // Disable cache for debugging
        console.log("DEBUG: Response Status:", res.status, res.statusText);

        if (!res.ok) {
            console.error("DEBUG: Fetch failed", await res.text());
            return null;
        }
        const data = await res.json();
        console.log("DEBUG: Data received:", data ? "Yes" : "No (null)");
        return data;
    } catch (error) {
        console.error("Error fetching firebase data:", error);
        return null;
    }
}

export async function generateMetadata(
    props: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const params = await props.params;
    const slug = params.slug;

    // 1. Get UID from Slug
    const uid = await fetchFirebaseData(`doctor_slugs/${slug}`);

    if (!uid) {
        console.log("DEBUG: No UID found for slug:", slug);
        return {
            title: 'Doctor Not Found',
        };
    }

    console.log("DEBUG: Found UID:", uid);

    // 2. Fetch Profile & Settings
    const [profile, landingSettings] = await Promise.all([
        fetchFirebaseData(`users/${uid}/profile`),
        fetchFirebaseData(`users/${uid}/landingSettings`)
    ]);

    if (!profile) {
        console.log("DEBUG: No profile found for UID:", uid);
        return { title: 'Doctor Profile' };
    }

    // Helper to get text (handling English/Bengali objects)
    const t = (obj: any) => {
        if (!obj) return "";
        if (typeof obj === 'string') return obj;
        return obj.en || Object.values(obj)[0] || "";
    };

    const name = t(profile.personal?.name) || 'Doctor';
    const speciality = t(profile.personal?.speciality) || 'Medical Professional';

    // Clean description: Strip HTML, Newlines -> Whitespace, Truncate to 60 chars
    let description = t(profile.about) || `${name} is a ${speciality} on Easy Prescribe.`;

    // Strip HTML tags using regex (basic)
    description = description.replace(/<[^>]*>?/gm, '');
    // Replace newlines with whitespace
    description = description.replace(/\s+/g, ' ');
    // Truncate to 60 chars
    if (description.length > 60) {
        description = description.substring(0, 57) + '...';
    }

    const images = [];
    if (landingSettings?.profileImageDetails) {
        images.push(landingSettings.profileImageDetails);
    } else {
        // Fallback or previous images
        const previousImages = (await parent).openGraph?.images || [];
        images.push(...previousImages);
    }

    // Construct Absolute URL for Images if they are relative
    const validImages = images.map(img => {
        if (typeof img === 'string' && img.startsWith('/')) {
            return new URL(img, process.env.NEXT_PUBLIC_BASE_URL || 'https://easyprescribe.app').toString();
        }
        return img;
    });

    return {
        title: `${name} - ${speciality}`,
        description: description,
        openGraph: {
            title: `${name} - ${speciality}`,
            description: description,
            images: validImages,
            type: 'profile',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} - ${speciality}`,
            description: description,
            images: validImages,
        }
    };
}

export default function DoctorLandingPage() {
    return <DoctorLandingClient />;
}
