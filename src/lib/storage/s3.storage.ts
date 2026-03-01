import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageProvider } from "./storage.interface";

export interface S3StorageConfig {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    bucketName?: string;
    /** Pre-signed URL expiry in seconds. Default: 7 days */
    expirySeconds?: number;
}

/**
 * AWS S3 storage provider.
 *
 * Usage:
 * ```ts
 * const storage = new S3Storage();
 * // or with explicit config:
 * const storage = new S3Storage({ bucketName: "my-bucket", region: "us-east-1" });
 *
 * const uploadUrl = await storage.putObjectUrl("avatar.png", "image/png");
 * const downloadUrl = await storage.getObjectUrl("avatar.png");
 * await storage.deleteObjects(["avatar.png", "old.jpg"]);
 * ```
 *
 * Reads from env by default:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
 */
export class S3Storage implements IStorageProvider {
    private client: S3Client;
    private bucketName: string;
    private expirySeconds: number;

    constructor(config: S3StorageConfig = {}) {
        const accessKeyId = config.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? "";
        const secretAccessKey = config.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY ?? "";
        const region = config.region ?? process.env.AWS_REGION ?? "us-east-1";

        if (!accessKeyId || !secretAccessKey) {
            throw new Error(
                "[nodekode/S3Storage] AWS credentials are not defined. " +
                "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars, " +
                "or pass them in the config object."
            );
        }

        this.client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });

        this.bucketName = config.bucketName ?? process.env.AWS_BUCKET_NAME ?? "";
        this.expirySeconds = config.expirySeconds ?? 7 * 24 * 60 * 60; // 7 days
    }

    async getObjectUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn: this.expirySeconds });
    }

    async putObjectUrl(filename: string, contentType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filename,
            ContentType: contentType,
        });
        return getSignedUrl(this.client, command, { expiresIn: this.expirySeconds });
    }

    async deleteObjects(keys: string[]): Promise<void> {
        const command = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
                Objects: keys.map((k) => ({ Key: k })),
            },
        });
        await this.client.send(command);
    }
}
