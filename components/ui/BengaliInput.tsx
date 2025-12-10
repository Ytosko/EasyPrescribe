"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";

interface BengaliInputProps {
    value: string;
    onChangeText: (text: string) => void;
    label: string;
    id: string;
    error?: string;
    icon?: React.ReactNode;
    className?: string;
    placeholder?: string;
}

export function BengaliInput({
    value,
    onChangeText,
    label,
    id,
    error,
    icon,
    className,
    placeholder = " "
}: BengaliInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");

    // Ref to handle click outside and cursor tracking
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const newCursorPos = e.target.selectionStart || 0;

        onChangeText(newValue); // Update parent state directly

        // Extract current word being typed
        const textBeforeCursor = newValue.substring(0, newCursorPos);
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];

        // Only fetch if last word contains English chars or numbers
        if (lastWord && /[a-zA-Z0-9]/.test(lastWord)) {
            setCurrentWord(lastWord);
            fetchSuggestions(lastWord);
        } else {
            setShowSuggestions(false);
            setCurrentWord("");
        }
    };

    // Apply suggestion
    const applySuggestion = (suggestion: string, suffix: string = "") => {
        if (!suggestion || !currentWord) return;

        const input = inputRef.current;
        if (!input) return;

        // We use the input's current cursor position (or state-tracked value)
        const pos = input.selectionStart || value.length;
        const textBeforeCursor = value.substring(0, pos);
        const textAfterCursor = value.substring(pos);

        // Replace the last word in textBeforeCursor with suggestion
        const lastWordRegex = new RegExp(`${currentWord}$`);
        const newTextBeforeCursor = textBeforeCursor.replace(lastWordRegex, suggestion);

        const newValue = newTextBeforeCursor + suffix + textAfterCursor;
        onChangeText(newValue);

        // Reset state
        setShowSuggestions(false);
        setSuggestions([]);
        setCurrentWord("");

        // Restore focus and update cursor
        input.focus();
        setTimeout(() => {
            const nextCursor = newTextBeforeCursor.length + suffix.length;
            input.setSelectionRange(nextCursor, nextCursor);
        }, 0);
    };

    // Keyboard navigation
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
            // Space to select first suggestion and append space
            if (suggestions.length > 0) {
                e.preventDefault();
                applySuggestion(suggestions[activeIndex], " ");
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    // Click outside handler is done via onBlur with logic below

    const hasValue = !!value;

    return (
        <div className={clsx("relative mb-6", className)} ref={containerRef}>
            <div className="relative">
                {icon && (
                    <div className={clsx(
                        "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 z-20",
                        isFocused ? "text-[#007ACC]" : "text-slate-400",
                        error && "text-red-500"
                    )}>
                        {icon}
                    </div>
                )}

                <input
                    ref={inputRef}
                    id={id}
                    className={clsx(
                        "peer block w-full rounded-t-lg border-0 border-b-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#007ACC] focus:outline-none focus:ring-0",
                        icon ? "pl-10" : "pl-4",
                        error ? "border-red-500 focus:border-red-500" : "border-slate-300",
                        "transition-colors duration-200"
                    )}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        // Delay hiding so click on suggestion registers
                        setTimeout(() => {
                            setShowSuggestions(false);
                        }, 200);
                    }}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    value={value}
                    placeholder={placeholder}
                    autoComplete="off"
                />

                <label
                    htmlFor={id}
                    className={clsx(
                        "absolute top-3 z-10 origin-[0] -translate-y-6 scale-75 transform cursor-text text-sm duration-200 pointer-events-none",
                        !isFocused && !hasValue && placeholder === " " ? "translate-y-0 scale-100" : "-translate-y-6 scale-75 text-[#007ACC]",
                        icon ? "left-10" : "left-4",
                        error && "text-red-500",
                        !isFocused && !hasValue && "text-slate-500"
                    )}
                >
                    {label}
                </label>

                {/* Custom Suggestion Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-b-lg shadow-xl z-50 mt-1 overflow-hidden">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    "px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex justify-between",
                                    index === activeIndex && "bg-blue-50 text-[#007ACC]"
                                )}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur stealing focus immediately
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
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
