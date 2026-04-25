import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateRoleDto {
    @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
    name?: string;

    @IsString({ message: 'El slug del rol debe ser una cadena de texto' })
    slug?: string;

    @IsString({ message: 'La descripción del rol debe ser una cadena de texto' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'El scope del rol debe ser una cadena de texto' })
    scope?: string;

    @IsString({ message: 'Los IDs de los permisos deben ser cadenas de texto' })
    @IsArray({ message: 'Los permisos deben ser un arreglo' })
    @IsUUID('4', { each: true, message: 'Cada ID de permiso debe ser un UUID válido' })
    permissionIds?: string[];
}