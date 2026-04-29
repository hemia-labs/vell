export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm)|audio\/(mpeg|wav|ogg)|application\/pdf)$/;

export const UPLOAD_SCOPES = ['contents', 'library', 'settings', 'users'] as const;

export type UploadScope = typeof UPLOAD_SCOPES[number];
