/**
 * Provider-agnostic storage interface.
 * Implement this to swap between S3, Azure Blob, GCS, etc.
 */
export interface IStorageProvider {
    /**
     * Returns a pre-signed URL to GET/download an object.
     */
    getObjectUrl(key: string): Promise<string>;

    /**
     * Returns a pre-signed URL to PUT/upload an object.
     */
    putObjectUrl(filename: string, contentType: string): Promise<string>;

    /**
     * Deletes one or more objects by key.
     */
    deleteObjects(keys: string[]): Promise<void>;
}
