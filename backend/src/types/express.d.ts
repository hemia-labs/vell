export {};

declare global {
  namespace Express {
    interface User {
      id?: string;
      userId?: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      roles: string[];
      permissions: string[];
      lastLogin?: Date | string;
    }
  }
}

export type MulterFile = Express.Multer.File;
