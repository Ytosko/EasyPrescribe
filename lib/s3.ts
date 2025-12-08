"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v7 as uuidv7 } from 'uuid';

const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: "https://s3api.cool.ytosko.dev",
    credentials: {
        accessKeyId: "Ytosko",
        secretAccessKey: "IOS319802na!"
    },
    forcePathStyle: true
});

export async function uploadFile(formData: FormData): Promise<{ url?: string; error?: string }> {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file uploaded" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const id = uuidv7();
        const ext = file.name.split('.').pop();
        const filename = `${id}.${ext}`;
        const key = `easy_prescribe/${filename}`;

        const command = new PutObjectCommand({
            Bucket: "backup",
            Key: key,
            Body: buffer,
            ContentType: file.type
        });

        await s3Client.send(command);

        const url = `https://s3api.cool.ytosko.dev/backup/easy_prescribe/${filename}`;
        return { url };
    } catch (error: any) {
        console.error("S3 Upload Error:", error);
        return { error: error.message || "Upload failed" };
    }
}

export async function uploadPdfBuffer(buffer: Buffer): Promise<string> {
    try {
        const id = uuidv7();
        const filename = `${id}.pdf`;
        const key = `easy_prescribe/${filename}`;

        const command = new PutObjectCommand({
            Bucket: "backup",
            Key: key,
            Body: buffer,
            ContentType: "application/pdf"
        });

        await s3Client.send(command);

        const url = `https://s3api.cool.ytosko.dev/backup/easy_prescribe/${filename}`;
        return url;
    } catch (error: any) {
        console.error("S3 PDF Upload Error:", error);
        throw new Error(error.message || "PDF Upload failed");
    }
}

export async function deleteFile(url: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // Extract key from URL
        // URL: https://s3api.cool.ytosko.dev/backup/easy_prescribe/filename.ext
        const parts = url.split('/backup/');
        if (parts.length < 2) {
            console.error("Invalid URL format for deletion:", url);
            return { error: "Invalid URL" };
        }
        const key = parts[1]; // easy_prescribe/filename.ext

        const command = new DeleteObjectCommand({
            Bucket: "backup",
            Key: key,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error: any) {
        console.error("S3 Delete Error:", error);
        return { error: error.message || "Delete failed" };
    }
}
