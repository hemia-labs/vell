import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
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

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    if (requiredRoles) {
      const userRoleSlugs = user.roles?.map((r: string) => r) || [];
      const hasRole = requiredRoles.some((role) => userRoleSlugs.includes(role));
      if (!hasRole) return false;
    }

    const userPermissions = user.permissions || [];
    return requiredPermissions.every(permission =>
      this.matchPermission(permission, userPermissions),
    );
  }

  private matchPermission(required: string, userPermissions: string[]): boolean {
    return userPermissions.some(userPerm => {
      // Acceso total
      if (userPerm === '*') return true;

      // Coincidencia exacta
      if (userPerm === required) return true;

      // Wildcard por módulo: content.* matchea content.create, content.edit, etc.
      if (userPerm.endsWith('.*')) {
        const module = userPerm.slice(0, -2); // "content"
        return required.startsWith(`${module}.`);
      }

      // Wildcard por acción y scope: content.edit.* matchea content.edit.own
      if (userPerm.includes('.*')) {
        const base = userPerm.replace('.*', '');
        return required.startsWith(base);
      }

      return false;
    });
  }
}