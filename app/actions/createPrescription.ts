"use server";

import { uploadPdfBuffer } from "@/lib/s3";

export async function createPrescription(templateName: string, data: any) {
    try {
        console.log("Generating PDF for template:", templateName);

        const payload = {
            template: {
                name: templateName
            },
            data: data
        };

        const response = await fetch(process.env.JSREPORT_API_URL || "https://report.cool.ytosko.dev/api/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Report API failed with status ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const pdfUrl = await uploadPdfBuffer(buffer);

        return { success: true, pdfUrl };
    } catch (error: any) {
        console.error("Prescription Generation Error:", error);
        return { success: false, error: error.message };
    }
}
