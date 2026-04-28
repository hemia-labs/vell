import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { MediaService } from "../media/media.service";
import { ContentMediaInputDto } from "./dtos/content-media-input.dto";
import { ContentMedia, ContentMediaRole } from "./entities/content-media.entity";

@Injectable()
export class ContentMediaService {
  constructor(
    @InjectRepository(ContentMedia)
    private repository: Repository<ContentMedia>,
    private mediaService: MediaService,
  ) {}

  async syncMedia(
    contentId: string,
    mediaItems: ContentMediaInputDto[] = [],
    manager?: EntityManager,
  ): Promise<ContentMedia[]> {
    const repository = manager?.getRepository(ContentMedia) ?? this.repository;
    await this.validateMediaItems(mediaItems, manager);

    await repository.update({ contentId }, { deletedAt: new Date() });

    const entities = mediaItems.map((item, index) => repository.create({
      contentId,
      mediaId: item.mediaId,
      role: item.role ?? ContentMediaRole.GALLERY,
      order: item.order ?? index,
      meta: item.meta ?? {},
      deletedAt: null,
    }));

    return repository.save(entities);
  }

  async validateMediaItems(mediaItems: ContentMediaInputDto[] = [], manager?: EntityManager): Promise<void> {
    const seen = new Set<string>();
    for (const item of mediaItems) {
      const role = item.role ?? ContentMediaRole.GALLERY;
      const key = `${item.mediaId}:${role}`;
      if (seen.has(key)) {
        throw new BadRequestException(`El media "${item.mediaId}" está duplicado para rol "${role}"`);
      }
      seen.add(key);
    }

    const ids = [...new Set(mediaItems.map(item => item.mediaId))];
    if (ids.length === 0) {
      return;
    }

    await this.mediaService.findByIds(ids, manager);
  }
}
