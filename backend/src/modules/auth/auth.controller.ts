
import { LocalAuthGuard } from "@/common/guards/local-auth.guard";
import { AuthService } from "./auth.service";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards, ValidationPipe } from "@nestjs/common";
import { LoginDto } from "./dtos/login.dto";
import { Response } from "express";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
  ) {}


  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,   
    @Res({ passthrough: true }) 
    response: Response
) {
    const user = (req as any).user;
    const authResult = await this.authService.generateAuthTokens(user);

    response.cookie('access_token', authResult.accessToken, authResult.cookies.access);
    response.cookie('refresh_token', authResult.refreshToken, authResult.cookies.refresh);

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    await this.authService.logout(req.user.userId);
    return true;
  }

  @Post('refresh')
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = req.cookies['refresh_token'];
    
    if (!oldRefreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    try {
        const { accessToken, refreshToken, cookies } = await this.authService.refresh(oldRefreshToken);
        response.cookie('access_token', accessToken, cookies.access);
        response.cookie('refresh_token', refreshToken, cookies.refresh);

        return { message: 'Token refreshed' };  
    } catch (error) {
      response.clearCookie('access_token');
      response.clearCookie('refresh_token');
      throw new UnauthorizedException('Invalid refresh token');
    }

  }


}