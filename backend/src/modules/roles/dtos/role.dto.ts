export class RolePermissionDto {
    id: string;
    slug: string;
    description: string;
}

export class RoleDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    scope: string;
    level: number;
    permissions: RolePermissionDto[];
}
