import { Permission } from "@/modules/permissions/entities/permission.entity";
import { CreateRoleDto } from "../dtos/create-role.dto";
import { RoleDto } from "../dtos/role.dto";
import { Role } from "../entities/role.entity";
import { UpdateRoleDto } from "../dtos/update-role.dto";

export class RoleMapper {
    static toDTO(role: Role): RoleDto {
        const roleDto = new RoleDto();
        roleDto.id = role.id;
        roleDto.name = role.name;
        roleDto.slug = role.slug;
        roleDto.description = role.description;
        roleDto.scope = role.scope;
        roleDto.permissions = role.permissions ? role.permissions.map(permission => ({
            id: permission.id,
            slug: permission.slug,
            description: permission.description
        })) : [];
        return roleDto;
    }

    static toEntity(roleDto: CreateRoleDto): Role {
        const role = new Role();
        role.name = roleDto.name;
        role.slug = roleDto.slug;
        role.description = roleDto.description;
        role.scope = roleDto.scope;
        if(roleDto.permissionIds) {
            role.permissions = roleDto.permissionIds.map(id => ({ id } as Permission));
        }
        return role;
    }

    static toUpdateEntity(roleDto: UpdateRoleDto): Role {
        const role = new Role();
        role.name = roleDto.name;
        role.slug = roleDto.slug;
        role.description = roleDto.description;
        role.scope = roleDto.scope;
        if(roleDto.permissionIds) {
            role.permissions = roleDto.permissionIds.map(id => ({ id } as Permission));
        }
        return role;
    }
}