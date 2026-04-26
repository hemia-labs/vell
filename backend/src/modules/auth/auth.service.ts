import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/user.service";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";
import { ConfigService } from "@nestjs/config";
import { UserDto } from "../users/dtos/user.dto";
import { AuthResponseDto } from "./dtos/auth-response.dto";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
   
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly configService: ConfigService,
    ) {}


    async validateUser(email: string, password: string): Promise<UserDto | null> {
        const user = await this.usersService.validateUser(email, password);
        return user || null;
    }

    /**
   * Genera tokens de acceso y refresh después de validar credenciales
   * @param user - Usuario ya autenticado (sin contraseña)
   * @returns Tokens de acceso y refresh
   */
  async generateAuthTokens(user: UserDto): Promise<AuthResponseDto> {

    const roles = user.roles?.map(r => r.slug) ?? [];
    const permissionsSet = new Set<string>();
    user.roles?.forEach(r => r.permissions?.forEach(p => permissionsSet.add(p.slug)));
    const permissions = Array.from(permissionsSet);
    const lastLogin = new Date();

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar ?? null,
      roles,
      permissions,
      lastLogin: lastLogin
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.usersService.updateLastLogin(user.id, lastLogin);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');


    const baseCookie = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
      domain: cookieDomain || undefined,
      path: '/',
    };

    return {
      accessToken,
      refreshToken,
      cookies: {
        access: {
          ...baseCookie,
          maxAge: 1 * 60 * 60 * 1000, // 1 hora
        },
        refresh: {
          ...baseCookie,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        },
      },
    };
  }

  /**
   * Genera un nuevo refresh token para un usuario
   * @param userId - ID del usuario
   * @returns Token de refresh generado
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');

    const expiresInSeconds = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN') || 604800;
    const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);

    await this.refreshTokenService.create({
        userId,
        token,
        expiresAt: expiryDate,
    });

    return token;
  }

  /**
   * Refresca los tokens de acceso y refresh token
   * @param oldToken - Token de refresh antiguo
   * @returns Nuevos tokens de acceso y refresh
   */
  async refresh(oldToken: string): Promise<AuthResponseDto> {

    const payload = await this.refreshTokenService.findValidToken(oldToken);
    if (payload) {
        const foundUser = await this.usersService.findOne({ where: { id: payload.userId }, relations: ['roles', 'roles.permissions'] });
        if (!foundUser) {
          throw new UnauthorizedException('Credenciales inválidas');
        }

        await this.refreshTokenService.revoke(oldToken);
        return this.generateAuthTokens(foundUser);
    }
    throw new UnauthorizedException('Refresh token logic needs complete implementation'); 
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }


}
