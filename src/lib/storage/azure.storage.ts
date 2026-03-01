import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { IStorageProvider } from "./storage.interface";

export interface AzureStorageConfig {
    accountName?: string;
    accountKey?: string;
    containerName?: string;
    /** SAS token expiry in seconds. Default: 7 days */
    expirySeconds?: number;
}

/**
 * Azure Blob Storage provider.
 *
 * Usage:
 * ```ts
 * const storage = new AzureStorage();
 * // or with explicit config:
 * const storage = new AzureStorage({ containerName: "uploads" });
 *
 * const uploadUrl  = await storage.putObjectUrl("avatar.png", "image/png");
 * const downloadUrl = await storage.getObjectUrl("avatar.png");
 * await storage.deleteObjects(["avatar.png", "old.jpg"]);
 * ```
 *
 * Reads from env by default:
 *   AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_STORAGE_CONTAINER_NAME
 */
export class AzureStorage implements IStorageProvider {
    private blobServiceClient: BlobServiceClient;
    private containerName: string;
    private accountName: string;
    private accountKey: string;
    private expirySeconds: number;

    constructor(config: AzureStorageConfig = {}) {
        this.accountName = config.accountName ?? process.env.AZURE_STORAGE_ACCOUNT_NAME ?? "";
        this.accountKey = config.accountKey ?? process.env.AZURE_STORAGE_ACCOUNT_KEY ?? "";
        this.containerName = config.containerName ?? process.env.AZURE_STORAGE_CONTAINER_NAME ?? "";
        this.expirySeconds = config.expirySeconds ?? 7 * 24 * 60 * 60;

        if (!this.accountName || !this.accountKey) {
            throw new Error(
                "[nodekode/AzureStorage] Azure credentials are not defined. " +
                "Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY env vars, " +
                "or pass them in the config object."
            );
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(
            this.accountName,
            this.accountKey
        );
        this.blobServiceClient = new BlobServiceClient(
            `https://${this.accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
    }

    async getObjectUrl(key: string): Promise<string> {
        const sasToken = this._generateSAS(key, "r");
        return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${key}?${sasToken}`;
    }

    async putObjectUrl(filename: string, _contentType: string): Promise<string> {
        const sasToken = this._generateSAS(filename, "w");
        return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${filename}?${sasToken}`;
    }

    async deleteObjects(keys: string[]): Promise<void> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        await Promise.all(
            keys.map((key) => containerClient.getBlobClient(key).deleteIfExists())
        );
    }

    private _generateSAS(blobName: string, permissions: string): string {
        const sharedKeyCredential = new StorageSharedKeyCredential(
            this.accountName,
            this.accountKey
        );
        const expiresOn = new Date(Date.now() + this.expirySeconds * 1000);
        const sasParams = generateBlobSASQueryParameters(
            {
                containerName: this.containerName,
                blobName,
                permissions: BlobSASPermissions.parse(permissions),
                expiresOn,
            },
            sharedKeyCredential
        );
        return sasParams.toString();
    }
}
