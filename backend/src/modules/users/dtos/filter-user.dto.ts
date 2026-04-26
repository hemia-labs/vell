import { Type } from "class-transformer";
import { IsBooleanString, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class FilterUserDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID('4', { message: 'El ID del rol debe ser un UUID válido' })
    roleId?: string;

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

    @IsOptional()
    @IsBooleanString({ message: 'all debe ser true o false' })
    all?: string;

    @IsOptional()
    @IsBooleanString({ message: 'withRoles debe ser true o false' })
    withRoles?: string;

    @IsOptional()
    @IsBooleanString({ message: 'withRoleId debe ser true o false' })
    withRoleId?: string;

    @IsOptional()
    @IsBooleanString({ message: 'withPermissions debe ser true o false' })
    withPermissions?: string;
}
