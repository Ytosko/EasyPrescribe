"use server";

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

export async function renderPrescription(templateName: string, data: any) {
    try {
        if (!templateName) templateName = 'template_A'; // Default

        const filePath = path.join(process.cwd(), 'prescriptions', `${templateName}.html`);

        if (fs.existsSync(filePath)) {
            const source = fs.readFileSync(filePath, 'utf-8');
            const template = Handlebars.compile(source);
            return template(data);
        } else {
            console.error(`Template file not found: ${filePath}`);
            return "<p>Error: Template file not found.</p>";
        }
    } catch (error) {
        console.error("Error rendering prescription:", error);
        return "<p>Error generating prescription preview.</p>";
    }
}
