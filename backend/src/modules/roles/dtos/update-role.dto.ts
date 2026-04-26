import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class UpdateRoleDto {
    @IsOptional()
    @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
    name?: string;

    @IsOptional()
    @IsString({ message: 'El slug del rol debe ser una cadena de texto' })
    slug?: string;

    @IsOptional()
    @IsString({ message: 'La descripción del rol debe ser una cadena de texto' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'El scope del rol debe ser una cadena de texto' })
    scope?: string;

    @IsOptional()
    @IsInt({ message: 'El nivel debe ser un número entero' })
    @Min(0, { message: 'El nivel mínimo es 0' })
    level?: number;

    @IsOptional()
    @IsArray({ message: 'Los permisos deben ser un arreglo' })
    @IsUUID('4', { each: true, message: 'Cada ID de permiso debe ser un UUID válido' })
    permissionIds?: string[];
}