import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateRoleDto {
    @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
    @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
    name: string;

    @IsNotEmpty({ message: 'El slug del rol es obligatorio' })
    @IsString( { message: 'El slug del rol debe ser una cadena de texto' })
    slug: string;

    @IsOptional()
    @IsString( { message: 'La descripción del rol debe ser una cadena de texto' })
    description: string;

    @IsOptional()
    @IsString( { message: 'El scope del rol debe ser una cadena de texto' })
    scope: string;

    @IsInt({ message: 'El nivel debe ser un número entero' })
    @Min(0, { message: 'El nivel mínimo es 0' })
    level: number;

    @IsNotEmpty({ message: 'Los permisos son obligatorios' })
    @IsArray({ message: 'Los permisos deben ser un arreglo' })
    @IsUUID('4', { each: true, message: 'Cada ID de permiso debe ser un UUID válido' })
    permissionIds: string[];
}