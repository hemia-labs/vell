export class TagContentDto {
  id: string;
  title: string;
  slug: string;
}

export class TagDto {
  id: string;
  name: string;
  slug: string;
  contents?: TagContentDto[];
  createdAt: Date;
  updatedAt: Date;
}
