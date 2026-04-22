import { IsArray, IsEmail, IsNotEmpty, IsUUID,  Matches, MinLength } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    name: string;
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    email: string;
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
        message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
        }
    )
    password: string;

    @IsNotEmpty({ message: 'Los roles son obligatorios' })
    @IsArray({ message: 'Los roles deben ser un arreglo' })
    @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID válido' })
    roles: string[];
}