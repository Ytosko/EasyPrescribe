"use server";

import fs from 'fs';
import path from 'path';

export async function getTemplateData(templateName: string) {
    try {
        // Map template_X to data_X.json
        // Example: template_A -> data_A.json
        const letter = templateName.split('_')[1]; // A, B, etc.
        if (!letter) return null;

        const filename = `data_${letter}.json`;
        const filePath = path.join(process.cwd(), 'prescriptions', filename);

        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(fileContent);
        } else {
            console.error(`Template data file not found: ${filePath}`);
            return null;
        }
    } catch (error) {
        console.error("Error reading template data:", error);
        return null;
    }
}
