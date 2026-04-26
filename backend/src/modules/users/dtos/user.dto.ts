export class UserDto {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    roles: UserRoleDto[];
    lastLogin: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export class UserRoleDto {
    id?: string;
    name: string;
    slug: string;
    description: string;
    permissions: {
        slug: string;
        description: string;
    }[];
}