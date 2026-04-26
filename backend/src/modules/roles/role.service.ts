import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { In, Repository } from "typeorm";
import { RoleDto } from "./dtos/role.dto";
import { RoleMapper } from "./mappers/role.mapper";
import { CreateRoleDto } from "./dtos/create-role.dto";
import { UpdateRoleDto } from "./dtos/update-role.dto";
import { FilterRoleDto } from "./dtos/filter-role.dto";
import { PermissionsService } from "../permissions/permission.service";

@Injectable()
export class RolesService {
   
    constructor(
        @InjectRepository(Role)
        private repository: Repository<Role>,
        private readonly permissionsService: PermissionsService,
    ) {}

    /**
     * Obtiene todos los roles disponibles en la base de datos, incluyendo sus permisos relacionados, y los convierte a un array de RoleDto utilizando el RoleMapper.
     * @returns Un array de RoleDto que representa todos los roles disponibles.
     */
    async findAll(params: FilterRoleDto): Promise<RoleDto[]> {
        const rolesQuery = this.repository.createQueryBuilder('role');
        const shouldLoadPermissions = params.permissions === true;
        const page = Number(params.page);
        const limit = Number(params.limit);

        if (shouldLoadPermissions) {
            rolesQuery.leftJoinAndSelect('role.permissions', 'permission');
        }

        if (params.search) {
            rolesQuery.andWhere('(role.name ILIKE :search OR role.slug ILIKE :search)', {
                search: `%${params.search}%`,
            });
        }

        if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
            rolesQuery.skip((page - 1) * limit).take(limit);
        }

        const roles = await rolesQuery
            .orderBy('role.createdAt', 'DESC')
            .getMany();

        return roles.map(role => RoleMapper.toDTO(role));
    }

    /**
     * Busca un rol por su ID en la base de datos, incluyendo sus permisos relacionados. Si el rol no se encuentra, lanza una excepción NotFoundException. Si se encuentra, convierte el rol a un RoleDto utilizando el RoleMapper y lo devuelve.
     * @param id El ID del rol que se desea buscar.
     * @returns Un RoleDto que representa el rol encontrado.
     * @throws NotFoundException Si no se encuentra un rol con el ID proporcionado.
     */
    async findById(id: string): Promise<RoleDto> {
        const role = await this.repository.findOne({ where: { id }, relations: ['permissions'] });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        return RoleMapper.toDTO(role);
    }

    /**
     * Busca un rol por su slug en la base de datos, incluyendo sus permisos relacionados.
     * @param slug El slug del rol que se desea buscar.
     * @returns Un RoleDto que representa el rol encontrado.
     * @throws NotFoundException Si no se encuentra un rol con el slug proporcionado.
     */
    async findBySlug(slug: string): Promise<RoleDto> {
        const role = await this.repository.findOne({ where: { slug }, relations: ['permissions'] });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        return RoleMapper.toDTO(role);
    }

    /**
     * Crea un nuevo rol en la base de datos utilizando los datos proporcionados en el CreateRoleDto.
     * @param dto Un CreateRoleDto que contiene los datos necesarios para crear un nuevo rol.
     * @returns Un RoleDto que representa el rol recién creado.
     */
    async create(dto: CreateRoleDto): Promise<RoleDto> {
        const existingRole = await this.repository.findOne({ where: { slug: dto.slug } });
        if (existingRole) {
            throw new ConflictException(`El slug "${dto.slug}" ya está registrado`);
        }

        await this.ensurePermissionsExist(dto.permissionIds);
        const entity = RoleMapper.toEntity(dto);
        const savedRole = await this.repository.save(entity);
        return RoleMapper.toDTO(savedRole);
    }

    /**
     * Actualiza un rol existente en la base de datos utilizando los datos proporcionados en el UpdateRoleDto.
     * @param id El ID del rol que se desea actualizar.
     * @param dto Un UpdateRoleDto que contiene los datos que se desean actualizar en el rol.
     * @returns Un RoleDto que representa el rol actualizado.
     * @throws NotFoundException Si no se encuentra un rol con el ID proporcionado.
     */
    async update(id: string, dto: UpdateRoleDto): Promise<RoleDto> {
        const role = await this.repository.findOne({ where: { id }, relations: ['permissions'] });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        if (dto.permissionIds !== undefined) {
            await this.ensurePermissionsExist(dto.permissionIds);
        }
        const updatedRole = this.repository.merge(role, RoleMapper.toUpdateEntity(dto));
        const savedRole = await this.repository.save(updatedRole);
        return RoleMapper.toDTO(savedRole);
    }

    /**
     * Busca múltiples roles por sus IDs.
     */
    async findByIds(ids: string[]): Promise<RoleDto[]> {
        const roles = await this.repository.findBy({ id: In(ids) });
        this.ensureAllIdsFound(ids, roles.map(role => role.id), 'roles');
        return roles.map(role => RoleMapper.toDTO(role));
    }

    /**
     * Elimina un rol de manera lógica en la base de datos estableciendo la fecha de eliminación.
     * @param id El ID del rol que se desea eliminar.
     */
    async delete(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.repository.update(id, { deletedAt: new Date() });
    }

    /**
     * Elimina un rol de manera permanente de la base de datos.
     * @param id El ID del rol que se desea eliminar permanentemente.
     */
    async hardDelete(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.repository.delete(id);
    }

    /**
     * Restaura un rol eliminado de manera lógica en la base de datos estableciendo la fecha de eliminación a null.
     * @param id El ID del rol que se desea restaurar.
     */
    async restore(id: string): Promise<void> {
        await this.ensureExists(id, true);
        await this.repository.update(id, { deletedAt: null });
    }

    private async ensureExists(id: string, withDeleted = false): Promise<Role> {
        const role = await this.repository.findOne({ where: { id }, withDeleted });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        return role;
    }

    private async ensurePermissionsExist(ids: string[]): Promise<void> {
        await this.permissionsService.ensureExistByIds(ids);
    }

    private ensureAllIdsFound(requestedIds: string[], foundIds: string[], label: string): void {
        const foundIdsSet = new Set(foundIds);
        const missingIds = requestedIds.filter(id => !foundIdsSet.has(id));

        if (missingIds.length > 0) {
            throw new BadRequestException(`No existen los siguientes ${label}: ${missingIds.join(', ')}`);
        }
    }



}
