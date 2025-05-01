import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';

@ApiTags('어드민 인증')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminLoginResponseDto> {
    const result = await this.authService.login(loginDto);
    
    // 리프레시 토큰을 쿠키에 설정 (httpOnly, secure)
    if (result.refreshToken) {
      response.cookie('admin_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });
    }
    
    // 응답에서 리프레시 토큰 제거 (보안상 이유로)
    const { refreshToken, ...responseData } = result;
    return responseData;
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '어드민 로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    // 리프레시 토큰 쿠키 제거
    response.clearCookie('admin_refresh_token');
    
    // 사용자 ID가 있으면 리프레시 토큰 무효화
    if (req.user && 'id' in req.user) {
      await this.authService.logout(req.user.id as string);
    }
    
    return { message: '로그아웃 성공' };
  }

  @Post('refresh')
  @ApiOperation({ summary: '어드민 토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    // 쿠키에서 리프레시 토큰 추출
    const refreshToken = req.cookies['admin_refresh_token'];
    
    if (!refreshToken) {
      response.status(401);
      return { accessToken: null };
    }
    
    try {
      // 토큰 갱신
      const result = await this.authService.refreshToken(refreshToken);
      
      // 새 리프레시 토큰이 있으면 쿠키 업데이트
      if (result.refreshToken) {
        response.cookie('admin_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });
      }
      
      return { accessToken: result.accessToken };
    } catch (error) {
      // 리프레시 토큰이 유효하지 않으면 쿠키 제거
      response.clearCookie('admin_refresh_token');
      response.status(401);
      return { accessToken: null };
    }
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '현재 로그인한 어드민 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '어드민 정보 조회 성공',
    schema: {
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Req() req: Request): Promise<any> {
    // JWT에서 추출한 사용자 정보 반환
    return req.user;
  }
}
