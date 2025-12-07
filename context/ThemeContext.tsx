"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { useAuth } from "@/context/AuthContext";

interface ThemeContextType {
    themeColor: string;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    themeColor: "#007ACC",
    resetTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [themeColor, setThemeColor] = useState("#007ACC");

    useEffect(() => {
        if (!user) {
            setThemeColor("#007ACC");
            document.documentElement.style.setProperty('--primary-color', "#007ACC");
            return;
        }

        const db = getDatabase();
        const settingsRef = ref(db, `users/${user.uid}/landingSettings/themeColor`);

        const unsubscribe = onValue(settingsRef, (snapshot) => {
            const color = snapshot.val();
            if (color) {
                setThemeColor(color);
                // Set CSS variable for Tailwind
                document.documentElement.style.setProperty('--primary-color', color);
            } else {
                setThemeColor("#007ACC");
                document.documentElement.style.setProperty('--primary-color', "#007ACC");
            }
        });

        return () => unsubscribe();
    }, [user]);

    const resetTheme = () => {
        // This serves as a helper, but actual reset usually happens by writing to DB
        // For client-side preview immediately before DB update persists:
        setThemeColor("#007ACC");
        document.documentElement.style.setProperty('--primary-color', "#007ACC");
    };

    return (
        <ThemeContext.Provider value={{ themeColor, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
