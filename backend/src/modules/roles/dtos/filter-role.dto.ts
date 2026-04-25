/**
 * @fileoverview DTO para filtrar roles.
 * Este DTO se utiliza para recibir los parámetros de filtrado al obtener la lista de roles.
 * Permite filtrar por nombre, slug, permisos, y paginación.
 * @property {string} [search] - Término de búsqueda para filtrar por nombre o slug.
 * @property {string} [permissions] - Indica si se deben incluir los permisos relacionados en la respuesta.
 * @property {number} [page] - Número de página para paginación.
 * @property {number} [limit] - Cantidad de resultados por página para paginación.
 */
export class FilterRoleDto {
    search?: string;
    permissions?: string;
    page?: number;
    limit?: number;
}