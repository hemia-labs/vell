export class RefreshTokenDto {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revoked: boolean;
}