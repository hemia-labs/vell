export class UserDto {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    roles: UserRoleDto[];
    isActive: boolean;
}

export class UserRoleDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    permissions: {
        id: string;
        slug: string;
        description: string;
    }[];
}