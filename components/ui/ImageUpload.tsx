"use client";

import { useState } from "react";
import { uploadFile } from "@/lib/s3";
import { FiUpload, FiX } from "react-icons/fi";
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    folder?: string; // Kept for interface compatibility but unused in S3 logic which has fixed path
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const result = await uploadFile(formData);
            if (result.url) {
                onChange(result.url);
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (value) {
        return (
            <div className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                <Image src={value} alt="Uploaded" fill className="object-cover" />
                <button
                    onClick={() => onChange("")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FiX size={12} />
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                    ) : (
                        <>
                            <FiUpload className="w-6 h-6 text-slate-400 mb-1" />
                            <p className="text-xs text-slate-500">Upload Logo</p>
                        </>
                    )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
        </div>
    );
}
