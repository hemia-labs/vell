import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { FindOneOptions, Repository } from "typeorm";
import { comparePassword, hashPassword } from "@/common/utils/hash.util";
import { UserDto } from "./dtos/user.dto";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserMapper } from "./mappers/user.mapper";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { FilterUserDto } from "./dtos/filter-user.dto";
import { RolesService } from "../roles/role.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly configService: ConfigService,
  ) {}


   /** Crea un nuevo usuario a partir de los datos proporcionados en el CreateUserDto. 
   * Verifica si el correo electrónico ya está registrado, hashea la contraseña y guarda el nuevo usuario en la base de datos.
   * @param createUserDto - Datos necesarios para crear un nuevo usuario
   * @returns El usuario creado convertido a UserDto
   * @throws ConflictException si el correo electrónico ya está registrado
   * @throws BadRequestException si ocurre un error al guardar el usuario
   */
    async create(createUserDto: CreateUserDto): Promise<UserDto> {
        const { email, password } = createUserDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        await this.ensureRolesExist(createUserDto.roles);
        const entity = UserMapper.toCreateEntity(createUserDto);
        const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
        const hashedPassword = await hashPassword(password, saltRounds);    
        const newUser = this.userRepository.create({
            ...entity,
            passwordHash: hashedPassword,
            isActive: true
        });
        try {
            const savedUser = await this.userRepository.save(newUser);
            return UserMapper.toDTO(savedUser);
        } catch (error) {
            throw new BadRequestException('Error al crear el usuario');
        }
    }

    /** Actualiza un usuario existente con los datos proporcionados en el UpdateUserDto.
    @param dto - Datos para actualizar el usuario
    @param id - ID del usuario a actualizar
    @returns El usuario actualizado convertido a UserDto
    @throws NotFoundException si no se encuentra un usuario con el ID proporcionado
    **/
    async update(dto: UpdateUserDto, targetUserId: string, requestingUserId: string): Promise<UserDto> {
        const user = await this.userRepository.findOne({ where: { id: targetUserId }, relations: ['roles', 'roles.permissions'] });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (dto.roles !== undefined) {
            await this.ensureRolesExist(dto.roles);
            await this.validateRoleHierarchy(requestingUserId, dto.roles);
        }

        const currentRoleIds = user.roles?.map(role => role.id) ?? [];
        const nextRoleIds = dto.roles;
        const newEntity = UserMapper.toUpdateEntity({ ...dto, roles: undefined });
        const updatedUser = this.userRepository.merge(user, newEntity);
        await this.userRepository.save(updatedUser);

        if (nextRoleIds !== undefined) {
            await this.userRepository
                .createQueryBuilder()
                .relation(User, 'roles')
                .of(targetUserId)
                .addAndRemove(nextRoleIds, currentRoleIds);
        }

        return this.findById(targetUserId);
    }

    /**
     * Verifica que el usuario que ejecuta la acción no asigne roles de mayor jerarquía que el suyo.
     * Menor número de level = mayor privilegio.
     */
    private async validateRoleHierarchy(requestingUserId: string, targetRoleIds: string[]): Promise<void> {
        const requestingUser = await this.userRepository.findOne({
            where: { id: requestingUserId },
            relations: ['roles'],
        });

        if (!requestingUser?.roles?.length) {
            throw new ForbiddenException('No tienes roles asignados');
        }

        const requesterMinLevel = Math.min(...requestingUser.roles.map(r => r.level ?? 99));

        if (requesterMinLevel === 0) {
            return; // super-admin puede asignar cualquier rol
        }

        const targetRoles = await this.rolesService.findByIds(targetRoleIds);

        const forbiddenRole = targetRoles.find(r => (r.level ?? 99) < requesterMinLevel);
        if (forbiddenRole) {
            throw new ForbiddenException(
                `No puedes asignar el rol "${forbiddenRole.name}" porque tiene mayor jerarquía que tu rol más alto`,
            );
        }
    }

    private async ensureRolesExist(roleIds: string[]): Promise<void> {
        await this.rolesService.findByIds(roleIds);
    }

    /** Elimina un usuario estableciendo su campo isActive a false y su campo deletedAt a la fecha actual.
    @param id - ID del usuario a eliminar
    @throws NotFoundException si no se encuentra un usuario con el ID proporcionado
    **/
    async delete(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepository.update(id, { isActive: false, deletedAt: new Date() });
    }

    /** Restaura un usuario eliminando suavemente estableciendo su campo isActive a true y su campo deletedAt a null.
    @param id - ID del usuario a restaurar
    @throws NotFoundException si no se encuentra un usuario con el ID proporcionado
    **/
    async hardDelete(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id }, withDeleted: true });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepository.delete(id);
    }

    /** Restaura un usuario eliminando la fecha de eliminación y estableciendo isActive a true.
    @param id - ID del usuario a restaurar
    @throws NotFoundException si no se encuentra un usuario con el ID proporcionado
    **/
    async restore(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id }, withDeleted: true });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepository.update(id, { isActive: true, deletedAt: null });
    }

    /**
     * Obtiene usuarios aplicando filtros de búsqueda, rol, relaciones, estado y paginación.
     * Por defecto devuelve usuarios activos. Si all=true, devuelve activos e inactivos.
     */
    async findAll(query: FilterUserDto = {}): Promise<UserDto[]> {
        const all = this.toBoolean(query.all);
        const withRoles = query.withRoles === undefined ? true : this.toBoolean(query.withRoles);
        const withPermissions = this.toBoolean(query.withPermissions);
        const withRoleId = this.toBoolean(query.withRoleId);
        const shouldLoadRoles = withRoles || withPermissions || withRoleId;
        const page = Number(query.page);
        const limit = Number(query.limit);

        const usersQuery = this.userRepository.createQueryBuilder('user');

        if (all) {
            usersQuery.withDeleted();
        } else {
            usersQuery.where('user.isActive = :isActive', { isActive: true });
        }

        if (shouldLoadRoles) {
            usersQuery.leftJoinAndSelect('user.roles', 'role');
        } else if (query.roleId) {
            usersQuery.innerJoin('user.roles', 'role');
        }

        if (withPermissions) {
            usersQuery.leftJoinAndSelect('role.permissions', 'permission');
        }

        if (query.search) {
            usersQuery.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
                search: `%${query.search}%`
            });
        }

        if (query.roleId) {
            usersQuery.andWhere('role.id = :roleId', { roleId: query.roleId });
        }

        if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
            usersQuery.skip((page - 1) * limit).take(limit);
        }

        const users = await usersQuery
            .orderBy('user.createdAt', 'DESC')
            .getMany();

        return users.map(user => UserMapper.toDTO(user, { withRoleId }));
    }

    /** Obtiene un usuario por su ID.
    @param id - ID del usuario a buscar
    @returns El usuario encontrado convertido a UserDto
    @throws NotFoundException si no se encuentra un usuario con el ID proporcionado
    **/
    async findOne(options: FindOneOptions<User>): Promise<UserDto> {
        const user = await this.userRepository.findOne(options);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return UserMapper.toDTO(user);
    }

    /** Obtiene un usuario por su ID, incluyendo sus roles y permisos relacionados.
     * @param id El ID del usuario que se desea buscar.
     * @returns Un UserDto que representa el usuario encontrado, incluyendo sus roles y permisos.
     * @throws NotFoundException Si no se encuentra un usuario con el ID proporcionado.
     */
    async findById(id: string): Promise<UserDto> {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return UserMapper.toDTO(user, { withRoleId: true });
    }

    /** Valida las credenciales de un usuario comparando el correo electrónico y la contraseña proporcionados con los almacenados en la base de datos.
     * @param email El correo electrónico del usuario que se desea validar.
     * @param password La contraseña en texto plano que se desea validar.
     * @returns Un UserDto que representa al usuario validado si las credenciales son correctas, o null si no lo son.
     */
    async validateUser(email: string, password: string): Promise<UserDto | null> {
        const user = await this.findByEmail(email);
        if (user && await comparePassword(password, user.passwordHash)) {
            return UserMapper.toDTO(user);
        }
        return null;
    }

    /** Busca un usuario por su correo electrónico, incluyendo sus roles y permisos relacionados.
     * @param email El correo electrónico del usuario que se desea buscar.
     * @returns Un User que representa el usuario encontrado, incluyendo sus roles y permisos.
     */
    private async findByEmail(email: string): Promise<User> {
        return await this.userRepository.findOne({ where: { email, isActive: true }, relations: ['roles', 'roles.permissions'] });
    }

    /** Actualiza la fecha del último inicio de sesión de un usuario.
     * @param userId El ID del usuario cuya fecha de último inicio de sesión se desea actualizar.
     * @param date La nueva fecha de último inicio de sesión.
     */
    async updateLastLogin(userId: string, date: Date): Promise<void> {
        await this.userRepository.update(userId, { lastLogin: date });
    }


    private toBoolean(value: boolean | string | undefined): boolean {
        return value === true || value === 'true' || value === '1';
    }

}
