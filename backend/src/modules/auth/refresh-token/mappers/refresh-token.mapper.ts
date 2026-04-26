import { RefreshToken } from "../../entities/refresh-token.entity";
import { RefreshTokenDto } from "../dtos/refresh-token.dto";

export class RefreshTokenMapper {
    static toDto(entity: RefreshToken): RefreshTokenDto {
        const dto = new RefreshTokenDto();
        dto.id = entity.id;
        dto.userId = entity.userId;
        dto.token = entity.token;
        dto.expiresAt = entity.expiresAt;
        dto.revoked = entity.isRevoked;
        return dto;
    }
}
