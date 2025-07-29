import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLE_PROTECTED } from 'src/auth/decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
  ) { }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles = this.reflector.get<string[]>(META_ROLE_PROTECTED, context.getHandler());

    if(!validRoles) { return true; }
    if(validRoles.length === 0) { return true; }
    //console.log(validRoles);
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) { throw new BadRequestException('No user found (request)'); }
    //console.log(user);
    //if (!validRoles.includes(user.role)) { throw new BadRequestException('User role is not valid'); }

    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true;
      }
    }
    throw new ForbiddenException(`User ${user.fullName} is not authorized, check list ${validRoles}`);
    //return true;
  }
}
