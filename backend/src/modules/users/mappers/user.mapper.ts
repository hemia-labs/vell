import { Role } from "@/modules/roles/entities/role.entity";
import { UserDto } from "../dtos/user.dto";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dtos/create-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";

interface UserMapperOptions {
    withRoleId?: boolean;
}

export class UserMapper {
    static toDTO(user: User, options: UserMapperOptions = {}): UserDto {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles ? user.roles.map(role => {
                const roleDto = {
                    name: role.name,
                    slug: role.slug,
                    description: role.description,
                    scope: role.scope,
                    permissions: role.permissions ? role.permissions.map(permission => ({
                        slug: permission.slug,
                        description: permission.description
                    })) : []
                };

                return options.withRoleId ? { id: role.id, ...roleDto } : roleDto;
            }) : [],
            avatar: user.avatarUrl,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt
        };
    }

    static toCreateEntity(userDto: CreateUserDto): Partial<User> {
        const user = new User();
        user.name = userDto.name;
        user.email = userDto.email;
        if (userDto.roles) {
            user.roles = userDto.roles.map(role => ({ id: role } as Role));
        }
        return user;
    }

    static toUpdateEntity(userDto: UpdateUserDto): Partial<User> {
        const user = new User();
        user.name = userDto.name;
        user.email = userDto.email;
        user.avatarUrl = userDto.avatar;
        user.isActive = userDto.isActive;
        if (userDto.roles) {
            user.roles = userDto.roles.map(role => ({ id: role } as Role));
        }
        return user;
    }
}
