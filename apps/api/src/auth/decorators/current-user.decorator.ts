import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Decorator to extract the current user from the request.
 * Returns `request.user` or `request.user[data]` when data is a string key.
 *
 * Usage:
 *   @CurrentUser() user: AccessTokenPayload
 *   @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (data) {
      return request.user?.[data];
    }

    return request.user;
  },
);
