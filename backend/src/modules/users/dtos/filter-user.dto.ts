export class FilterUserDto {
    all?: boolean = false;
    search?: string;
    roleId?: string;
    page?: number;
    limit?: number;
    withRoles?: boolean = true;
    withRoleId?: boolean = false;
    withPermissions?: boolean = false;
}