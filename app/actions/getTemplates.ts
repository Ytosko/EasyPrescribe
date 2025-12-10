"use server";

import fs from 'fs/promises';
import path from 'path';

const PRESCRIPTIONS_DIR = path.join(process.cwd(), 'prescriptions');

export interface TemplateData {
    name: string;
    templateContent: string;
    defaultData: any;
}

export async function getTemplates(): Promise<TemplateData[]> {
    try {
        const files = await fs.readdir(PRESCRIPTIONS_DIR);
        const templates: TemplateData[] = [];

        // Find pairs of .html and .json files
        const htmlFiles = files.filter(f => f.endsWith('.html'));

        for (const htmlFile of htmlFiles) {
            const baseName = path.parse(htmlFile).name; // e.g., 'template_A'
            const jsonFile = baseName.replace('template', 'data') + '.json'; // e.g., 'data_A.json'

            if (files.includes(jsonFile)) {
                try {
                    const htmlContent = await fs.readFile(path.join(PRESCRIPTIONS_DIR, htmlFile), 'utf-8');
                    const jsonContent = await fs.readFile(path.join(PRESCRIPTIONS_DIR, jsonFile), 'utf-8');

                    templates.push({
                        name: baseName,
                        templateContent: htmlContent,
                        defaultData: JSON.parse(jsonContent)
                    });
                } catch (err) {
                    console.error(`Error reading template pair ${baseName}:`, err);
                }
            }
        }

        return templates;
    } catch (error) {
        console.error("Error reading prescriptions directory:", error);
        return [];
    }
}
