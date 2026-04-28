import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { Media } from "./entities/media.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private repository: Repository<Media>,
  ) {}

  async ensureExistsById(id: string): Promise<Media> {
    const media = await this.repository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  async findByIds(ids: string[], manager?: EntityManager): Promise<Media[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const repository = manager?.getRepository(Media) ?? this.repository;
    const media = await repository.findBy({ id: In(uniqueIds) });
    const foundIds = new Set(media.map(item => item.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`No existen los siguientes media: ${missingIds.join(', ')}`);
    }

    return media;
  }
}
