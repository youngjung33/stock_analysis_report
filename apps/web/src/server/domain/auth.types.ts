/** JWT access token claims — userId는 sub 필드만 사용 */
export interface AccessTokenPayload {
  sub: string;
  username: string;
  jti: string;
}
