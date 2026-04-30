import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Permission } from "./entities/permission.entity";

@Injectable()
export class PermissionsService {
    constructor(
        @InjectRepository(Permission)
        private readonly repository: Repository<Permission>,
    ) {}

    async findAll(): Promise<Permission[]> {
        return this.repository.find({ order: { slug: 'ASC' } });
    }

    async ensureExistByIds(ids: string[]): Promise<void> {
        const permissions = await this.repository.findBy({ id: In(ids) });
        const foundIds = new Set(permissions.map(permission => permission.id));
        const missingIds = ids.filter(id => !foundIds.has(id));

        if (missingIds.length > 0) {
            throw new BadRequestException(`No existen los siguientes permisos: ${missingIds.join(', ')}`);
        }
    }
}
