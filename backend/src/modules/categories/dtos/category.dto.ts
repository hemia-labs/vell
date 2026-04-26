export class CategoryParentDto {
  id: string;
  name: string;
  slug: string;
}

export class CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  parent?: CategoryParentDto;
  children?: CategoryDto[];
  createdAt: Date;
  updatedAt: Date;
}
