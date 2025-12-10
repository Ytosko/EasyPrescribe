"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

interface MaterialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
    inputClassName?: string;
}

export function MaterialInput({ label, error, icon, className, inputClassName, id, ...props }: MaterialInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setHasValue(!!e.target.value);
        props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(!!e.target.value);
        props.onChange?.(e);
    };

    return (
        <div className={clsx("relative mb-6", className)}>
            <div className="relative">
                {icon && (
                    <div className={clsx(
                        "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                        isFocused ? "text-[#007ACC]" : "text-slate-400",
                        error && "text-red-500"
                    )}>
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    className={clsx(
                        "peer block w-full rounded-t-lg border-0 border-b-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#007ACC] focus:outline-none focus:ring-0",
                        icon ? "pl-10" : "pl-4",
                        error ? "border-red-500 focus:border-red-500" : "border-slate-300",
                        "transition-colors duration-200",
                        inputClassName
                    )}
                    placeholder=" "
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={clsx(
                        "absolute top-3 z-10 origin-[0] -translate-y-6 scale-75 transform cursor-text text-sm duration-200 peer-focus:-translate-y-6 peer-focus:scale-75 peer-autofill:-translate-y-6 peer-autofill:scale-75 pointer-events-none",
                        !props.placeholder && "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
                        icon ? "left-10" : "left-4",
                        isFocused || hasValue || props.placeholder ? "text-[#007ACC]" : "text-slate-500",
                        error && "text-red-500"
                    )}
                >
                    {label}
                </label>
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
