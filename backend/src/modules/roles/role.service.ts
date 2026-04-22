import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { Repository } from "typeorm";
import { RoleDto } from "./dtos/role.dto";
import { RoleMapper } from "./mappers/role.mapper";
import { CreateRoleDto } from "./dtos/create-role.dto";
import { UpdateRoleDto } from "./dtos/update-role.dto";

@Injectable()
export class RolesService {
   
    constructor(
        @InjectRepository(Role)
        private repository: Repository<Role>
    ) {}

    /**
     * Obtiene todos los roles disponibles en la base de datos, incluyendo sus permisos relacionados, y los convierte a un array de RoleDto utilizando el RoleMapper.
     * @returns Un array de RoleDto que representa todos los roles disponibles.
     */
    async findAll(): Promise<RoleDto[]> {
        const roles = await this.repository.find({ relations: ['permissions'] });
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
        const updatedRole = this.repository.merge(role, RoleMapper.toUpdateEntity(dto));
        const savedRole = await this.repository.save(updatedRole);
        return RoleMapper.toDTO(savedRole);
    }

    /**
     * Elimina un rol de manera lógica en la base de datos estableciendo la fecha de eliminación.
     * @param id El ID del rol que se desea eliminar.
     */
    async delete(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: new Date() });
    }

    /**
     * Elimina un rol de manera permanente de la base de datos.
     * @param id El ID del rol que se desea eliminar permanentemente.
     */
    async hardDelete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Restaura un rol eliminado de manera lógica en la base de datos estableciendo la fecha de eliminación a null.
     * @param id El ID del rol que se desea restaurar.
     */
    async restore(id: string): Promise<void> {
        await this.repository.update(id, { deletedAt: null });
    }



}