import { Role } from "@/modules/roles/entities/role.entity";
import { UserDto } from "../dtos/user.dto";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dtos/create-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";

export class UserMapper {
    static toDTO(user: User): UserDto {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles ? user.roles.map(role => ({
                id: role.id,
                name: role.name,
                slug: role.slug,
                description: role.description,
                permissions: role.permissions ? role.permissions.map(permission => ({
                    id: permission.id,
                    slug: permission.slug,
                    description: permission.description
                })) : []
            })) : [],
            avatar: user.avatarUrl,
            isActive: user.isActive
        };
    }

    static toCreateEntity(userDto: CreateUserDto): User {
        const user = new User();
        user.name = userDto.name;
        user.email = userDto.email;
        if (userDto.roles) {
            user.roles = userDto.roles.map(role => ({ id: role } as Role));
        }
        return user;
    }

    static toUpdateEntity(userDto: UpdateUserDto): User {
        const user = new User();
        user.name = userDto.name;
        user.email = userDto.email;
        user.avatarUrl = userDto.avatar;
        if (userDto.roles) {
            user.roles = userDto.roles.map(role => ({ id: role } as Role));
        }
        return user;
    }
}