import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from '../supabase/tenant.middleware';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FRANCHISE = 'FRANCHISE',
  DEALER = 'DEALER',
  SUB_DEALER = 'SUB_DEALER',
  STAFF = 'STAFF',
  USER = 'USER'
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 7,
  [UserRole.ADMIN]: 6,
  [UserRole.FRANCHISE]: 5,
  [UserRole.DEALER]: 4,
  [UserRole.SUB_DEALER]: 3,
  [UserRole.STAFF]: 2,
  [UserRole.USER]: 1
};

export interface PermissionRequirement {
  action: string;
  resource: string;
  scope?: 'GLOBAL' | 'TENANT' | 'BRANCH' | 'OWN';
}

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['tenantContext'] as TenantContext;

    if (!user) {
      throw new ForbiddenException('No tenant context');
    }

    const userLevel = ROLE_HIERARCHY[user.userRole as UserRole] || 0;
    const hasRole = requiredRoles.some(role => 
      ROLE_HIERARCHY[role] && userLevel >= ROLE_HIERARCHY[role]
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

@Injectable()
export class ABACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>('permission', [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['tenantContext'] as TenantContext;

    if (!user) {
      throw new ForbiddenException('No tenant context');
    }

    switch (requirement.scope) {
      case 'GLOBAL':
        return user.userRole === UserRole.SUPER_ADMIN;
      case 'TENANT':
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE].includes(user.userRole as UserRole);
      case 'BRANCH':
        return user.branchId !== undefined;
      case 'OWN':
        return true;
      default:
        return false;
    }
  }
}

import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const Permission = (requirement: PermissionRequirement) => SetMetadata('permission', requirement);