"use client";

import { useState } from "react";
import { FiType } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingAvroButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isBangla, setIsBangla] = useState(false);

    const toggleLanguage = () => {
        setIsBangla(!isBangla);
        // In a real implementation, this would trigger a global context or event
        // to switch the input method. For now, it's a UI indicator.
        if (!isBangla) {
            // alert("Bengali Typing Mode (Avro Style) Enabled");
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white p-2 rounded-lg shadow-xl border border-slate-200 mb-2"
                    >
                        <button
                            onClick={toggleLanguage}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isBangla ? 'bg-green-50 text-green-700' : 'hover:bg-slate-50'}`}
                        >
                            <span className="font-bold text-lg">অ</span>
                            <span className="text-sm font-medium">{isBangla ? 'Avro ON' : 'Switch to Bangla'}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isBangla ? 'bg-green-600 text-white' : 'bg-[#007ACC] text-white'}`}
            >
                {isBangla ? <span className="font-bold text-xl">অ</span> : <FiType size={24} />}
            </button>
        </div>
    );
}
