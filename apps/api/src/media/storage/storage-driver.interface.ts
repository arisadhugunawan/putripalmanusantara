export interface UploadedFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StorageDriver {
  /** Stores the file and returns its publicly reachable URL. */
  upload(file: UploadedFileInput): Promise<{ url: string }>;
  /** Removes a previously stored file, identified by the URL `upload` returned. */
  delete(url: string): Promise<void>;
}

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
