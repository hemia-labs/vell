import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateUserDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    name?: string;

    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    email?: string;

    @IsNotEmpty({ message: 'Los roles son obligatorios' })
    @IsArray({ message: 'Los roles deben ser un arreglo' })
    @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID válido' })
    roles?: string[];

    @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
    isActive?: boolean;

    @IsOptional()
    @IsString({ message: 'El avatar debe ser una cadena de texto' })
    avatar?: string | null;
}