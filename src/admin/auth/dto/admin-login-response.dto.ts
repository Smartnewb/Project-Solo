import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginResponseDto {
  @ApiProperty({ description: '액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '사용자 정보' })
  user: {
    @ApiProperty({ description: '사용자 ID' })
    id: string;

    @ApiProperty({ description: '이메일' })
    email: string;

    @ApiProperty({ description: '역할', example: 'admin' })
    role: string;
  };
}
