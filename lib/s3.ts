"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v7 as uuidv7 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
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
            Bucket: process.env.S3_BUCKET_NAME || "backup",
            Key: key,
            Body: buffer,
            ContentType: file.type
        });

        await s3Client.send(command);

        const url = `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL_PREFIX}/easy_prescribe/${filename}`;
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
            Bucket: process.env.S3_BUCKET_NAME || "backup",
            Key: key,
            Body: buffer,
            ContentType: "application/pdf"
        });

        await s3Client.send(command);

        const url = `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL_PREFIX}/easy_prescribe/${filename}`;
        return url;
    } catch (error: any) {
        console.error("S3 PDF Upload Error:", error);
        throw new Error(error.message || "PDF Upload failed");
    }
}

export async function deleteFile(url: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const parts = url.split('/backup/easy_prescribe/');
        if (parts.length < 2) {
            console.error("Invalid URL format for deletion:", url);
            return { error: "Invalid URL" };
        }
        const key = parts[1]; // easy_prescribe/filename.ext

        const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || "backup",
            Key: key,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error: any) {
        console.error("S3 Delete Error:", error);
        return { error: error.message || "Delete failed" };
    }
}
