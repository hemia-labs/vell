export interface TagContent {
  id: string
  title: string
  slug: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  contents?: TagContent[]
  createdAt: string
  updatedAt: string
}

export interface CreateTag {
  name: string
  slug: string
}

export type UpdateTag = Partial<CreateTag>

export interface FilterTagParams {
  search?: string
  withContents?: boolean
  page?: number
  limit?: number
}
