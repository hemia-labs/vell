import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const userPermissions = user.permissions || [];
    return requiredPermissions.every(permission =>
      this.matchPermission(permission, userPermissions),
    );
  }

  private matchPermission(required: string, userPermissions: string[]): boolean {
    return userPermissions.some(userPerm => {
      if (userPerm === '*') return true;
      if (userPerm === required) return true;

      if (userPerm.endsWith(':*')) {
        const module = userPerm.slice(0, -2);
        return required.startsWith(`${module}:`);
      }

      return false;
    });
  }
}
