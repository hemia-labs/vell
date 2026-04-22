import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { FindOneOptions, Repository } from "typeorm";
import { comparePassword, hashPassword } from "@/common/utils/hash.util";
import { UserDto } from "./dtos/user.dto";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserMapper } from "./mappers/user.mapper";
import { UpdateUserDto } from "./dtos/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
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

        const entity = UserMapper.toCreateEntity(createUserDto);
        const hashedPassword = await hashPassword(password);    
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
    async update(dto: UpdateUserDto, id: string): Promise<UserDto> {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const newEntity = UserMapper.toUpdateEntity(dto);
        const updatedUser = this.userRepository.merge(user, newEntity);
        const savedUser = await this.userRepository.save(updatedUser);
        return UserMapper.toDTO(savedUser);
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

    /**
     * Obtiene una lista de todos los usuarios activos en la base de datos.
     * @returns Una lista de UserDto que representa a los usuarios activos
     */
    async findAll(): Promise<UserDto[]> {
        const users = await this.userRepository.find({ where: { isActive: true }, relations: ['roles', 'roles.permissions'] });
        return users.map(user => UserMapper.toDTO(user));
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
        const user = await this.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
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
        return await this.userRepository.findOne({ where: { email }, relations: ['roles', 'roles.permissions'] });
    }



}