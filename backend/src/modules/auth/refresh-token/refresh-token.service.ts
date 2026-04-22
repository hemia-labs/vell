import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";
import { Repository } from "typeorm";
import { CreateRefreshTokenDto } from "./dtos/create-refresh-token.dto";
import { RefreshTokenDto } from "./dtos/refresh-token.dto";
import { User } from "@/modules/users/entities/user.entity";
import { RefreshTokenMapper } from "./mappers/refresh-token.mapper";


@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async create(data: CreateRefreshTokenDto): Promise<RefreshTokenDto> {
    const { userId, token, expiresAt } = data;
    const refreshToken = await this.refreshTokenRepo.save({
      token,
      user: { id: userId } as User,
      expiresAt,
      isRevoked: false
    });
    return RefreshTokenMapper.toDto(refreshToken);
  }

   async findValidToken(token: string): Promise< RefreshTokenDto | null > {
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token, isRevoked: false }
    });
    if (!refreshToken) {
      return null;
    }
    return RefreshTokenMapper.toDto(refreshToken);
  }

  async revoke(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepo.findOne({ where: { token } });
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

}