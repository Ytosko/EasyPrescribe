"use client";

import { useState, useEffect } from "react";
import { renderPrescription } from "@/app/actions/renderPrescription";

export default function PrescriptionViewer({ data }: { data: any }) {
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHtml = async () => {
            try {
                const templateName = data.template?.name || 'template_A';
                const rendered = await renderPrescription(templateName, data);
                setHtml(rendered);
            } catch (e) {
                console.error(e);
                setHtml("<p>Error loading prescription.</p>");
            } finally {
                setLoading(false);
            }
        };
        loadHtml();
    }, [data]);

    if (loading) return <div className="p-4 text-center text-xs text-slate-400">Loading preview...</div>;

    return (
        <div
            className="prescription-preview bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
