import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";
import { MoreThan, Repository } from "typeorm";
import { CreateRefreshTokenDto } from "./dtos/create-refresh-token.dto";
import { RefreshTokenDto } from "./dtos/refresh-token.dto";
import { User } from "@/modules/users/entities/user.entity";
import { RefreshTokenMapper } from "./mappers/refresh-token.mapper";
import { createHash } from "crypto";


@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async create(data: CreateRefreshTokenDto): Promise<RefreshTokenDto> {
    const { userId, token, expiresAt } = data;
    const refreshToken = await this.refreshTokenRepo.save({
      token: this.hashToken(token),
      user: { id: userId } as User,
      expiresAt,
      isRevoked: false
    });
    return RefreshTokenMapper.toDto(refreshToken);
  }

   async findValidToken(token: string): Promise< RefreshTokenDto | null > {
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: {
        token: this.hashToken(token),
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      }
    });
    if (!refreshToken) {
      return null;
    }
    return RefreshTokenMapper.toDto(refreshToken);
  }

  async revoke(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepo.findOne({ where: { token: this.hashToken(token) } });
    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepo.save(refreshToken);
    }
  }

   async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { user: { id: userId } },
      { isRevoked: true }
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

}
