import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FilterSettingDto } from "./dtos/filter-setting.dto";
import { PublicSettingDto, SettingDto } from "./dtos/setting.dto";
import { UpdateSettingDto } from "./dtos/update-setting.dto";
import { Setting, SettingGroup, SettingType } from "./entities/setting.entity";

const SECRET_KEY_PATTERN = /(password|secret|token|api_key|private_key)/i;
const MASKED_SECRET = '********';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private repository: Repository<Setting>,
  ) {}

  async findAll(params: FilterSettingDto = {}): Promise<SettingDto[]> {
    const query = this.repository.createQueryBuilder('setting');

    if (params.group) {
      query.andWhere('setting.group = :group', { group: params.group });
    }

    if (params.search) {
      query.andWhere('(setting.key ILIKE :search OR setting.description ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    const settings = await query
      .orderBy('setting.group', 'ASC')
      .addOrderBy('setting.key', 'ASC')
      .getMany();

    return settings.map(setting => this.toDto(setting));
  }

  async findPublic(): Promise<PublicSettingDto[]> {
    const settings = await this.repository.find({
      where: { isPublic: true },
      order: { group: 'ASC', key: 'ASC' },
    });

    return settings.map(setting => ({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      group: setting.group,
    }));
  }

  async findByKey(key: string): Promise<SettingDto> {
    return this.toDto(await this.ensureExists(key));
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.repository.findOne({ where: { key } });
    return (setting?.value ?? null) as T | null;
  }

  async findByGroup(group: SettingGroup): Promise<SettingDto[]> {
    return this.findAll({ group });
  }

  async update(key: string, dto: UpdateSettingDto): Promise<SettingDto> {
    const setting = await this.ensureExists(key);

    if (setting.isReadonly) {
      throw new ForbiddenException('Setting is readonly');
    }

    if (this.isSecretSetting(setting.key) && dto.value === MASKED_SECRET) {
      throw new BadRequestException('Secret value must be changed explicitly');
    }

    this.validateValue(setting.type, dto.value);
    setting.value = dto.value;

    return this.toDto(await this.repository.save(setting));
  }

  private async ensureExists(key: string): Promise<Setting> {
    const setting = await this.repository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }

  private validateValue(type: SettingType, value: unknown): void {
    if (value === null) {
      return;
    }

    if (type === SettingType.TEXT || type === SettingType.IMAGE) {
      if (typeof value !== 'string') {
        throw new BadRequestException('Setting value must be text');
      }
      return;
    }

    if (type === SettingType.NUMBER) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new BadRequestException('Setting value must be a number');
      }
      return;
    }

    if (type === SettingType.BOOLEAN) {
      if (typeof value !== 'boolean') {
        throw new BadRequestException('Setting value must be boolean');
      }
      return;
    }

    if (type === SettingType.ARRAY) {
      if (!Array.isArray(value)) {
        throw new BadRequestException('Setting value must be an array');
      }
      return;
    }

    if (type === SettingType.JSON) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new BadRequestException('Setting value must be a JSON object');
      }
    }
  }

  private toDto(setting: Setting): SettingDto {
    const shouldMask = this.isSecretSetting(setting.key) && setting.value !== null;

    return {
      id: setting.id,
      key: setting.key,
      value: shouldMask ? MASKED_SECRET : setting.value,
      type: setting.type,
      group: setting.group,
      description: setting.description,
      isPublic: setting.isPublic,
      isReadonly: setting.isReadonly,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  private isSecretSetting(key: string): boolean {
    return SECRET_KEY_PATTERN.test(key);
  }
}
