import { ContentTypeFieldDto } from "./content-type-field.dto";

export class ContentTypeDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  fields?: ContentTypeFieldDto[];
  createdAt: Date;
  updatedAt: Date;
}
