"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";

interface BengaliTextareaProps {
    value: string;
    onChangeText: (text: string) => void;
    label: string;
    id?: string;
    error?: string;
    className?: string;
    placeholder?: string;
    rows?: number;
}

export function BengaliTextarea({
    value,
    onChangeText,
    label,
    id,
    error,
    className,
    placeholder = "...",
    rows = 3,
    dropUp = false
}: BengaliTextareaProps & { dropUp?: boolean }) {
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");

    // ... logic ...

    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch suggestions from Google Input Tools API
    const fetchSuggestions = async (word: string) => {
        if (!word) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`https://inputtools.google.com/request?text=${word}&itc=bn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
            const data = await res.json();
            if (data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
                const results = data[1][0][1];
                setSuggestions(results);
                setShowSuggestions(true);
                setActiveIndex(0);
            }
        } catch (e) {
            console.error("Failed to fetch suggestions", e);
        }
    };

    // ... existing logic ...

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const newCursorPos = e.target.selectionStart || 0;

        onChangeText(newValue);

        const textBeforeCursor = newValue.substring(0, newCursorPos);
        // Split by whitespace or newlines
        const words = textBeforeCursor.split(/[\s\n]+/);
        const lastWord = words[words.length - 1];

        if (lastWord && /[a-zA-Z0-9]/.test(lastWord)) {
            setCurrentWord(lastWord);
            fetchSuggestions(lastWord);

            // Minimal attempt to position dropdown near cursor (tricky in textarea)
            // For now, we'll anchor it to the bottom of the textarea or just basic positioning
            // Advanced caret coordinate finding is complex without extra libs.
            // We will stick to simple positioning for MVP.
        } else {
            setShowSuggestions(false);
            setCurrentWord("");
        }
    };

    // Apply suggestion
    const applySuggestion = (suggestion: string, suffix: string = "") => {
        if (!suggestion || !currentWord) return;

        const input = textareaRef.current;
        if (!input) return;

        const pos = input.selectionStart || value.length;
        const textBeforeCursor = value.substring(0, pos);
        const textAfterCursor = value.substring(pos);

        const lastWordRegex = new RegExp(`${currentWord}$`);
        const newTextBeforeCursor = textBeforeCursor.replace(lastWordRegex, suggestion);

        const newValue = newTextBeforeCursor + suffix + textAfterCursor;
        onChangeText(newValue);

        setShowSuggestions(false);
        setSuggestions([]);
        setCurrentWord("");

        input.focus();
        setTimeout(() => {
            const nextCursor = newTextBeforeCursor.length + suffix.length;
            input.setSelectionRange(nextCursor, nextCursor);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (suggestions.length > 0) {
                e.preventDefault();
                applySuggestion(suggestions[activeIndex]);
            }
        } else if (e.key === " ") {
            if (suggestions.length > 0) {
                e.preventDefault();
                applySuggestion(suggestions[activeIndex], " ");
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    return (
        <div className={clsx("relative flex flex-col gap-1", className)} ref={containerRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    id={id}
                    className={clsx(
                        "w-full p-3 text-base font-medium border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50 shadow-sm transition-colors duration-200",
                        error ? "border-red-500 focus:border-red-500" : "border-slate-200"
                    )}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    value={value}
                    placeholder={placeholder}
                    rows={rows}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div
                        className={clsx(
                            "absolute left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden",
                            dropUp ? "bottom-full mb-1" : "top-full mt-1"
                        )}
                    >
                        <div className="bg-slate-50 px-2 py-1 text-[10px] text-slate-400 border-b border-slate-100 flex justify-between">
                            <span>Select: Enter/Space</span>
                            <span>Ignore: Esc</span>
                        </div>
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    "px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex justify-between",
                                    index === activeIndex && "bg-blue-50 text-[#007ACC]"
                                )}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    applySuggestion(suggestion);
                                }}
                            >
                                <span>{suggestion}</span>
                                <span className="text-xs text-slate-400">{index + 1}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
