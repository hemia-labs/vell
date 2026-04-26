import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

/**
 * @fileoverview DTO para filtrar roles.
 * Este DTO se utiliza para recibir los parámetros de filtrado al obtener la lista de roles.
 * Permite filtrar por nombre, slug, permisos, y paginación.
 * @property {string} [search] - Término de búsqueda para filtrar por nombre o slug.
 * @property {boolean} [permissions] - Indica si se deben incluir los permisos relacionados en la respuesta.
 * @property {number} [page] - Número de página para paginación.
 * @property {number} [limit] - Cantidad de resultados por página para paginación.
 */
export class FilterRoleDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    permissions?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La página debe ser un número entero' })
    @Min(1, { message: 'La página mínima es 1' })
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1, { message: 'El límite mínimo es 1' })
    limit?: number;
}
