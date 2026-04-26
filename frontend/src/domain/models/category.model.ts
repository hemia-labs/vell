export interface CategoryParent {
  id: string
  name: string
  slug: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  parent?: CategoryParent
  children?: Category[]
  createdAt: string
  updatedAt: string
}

export interface CreateCategory {
  name: string
  slug: string
  description?: string
  parentId?: string | null
}

export type UpdateCategory = Partial<CreateCategory>

export interface FilterCategoryParams {
  search?: string
  parentId?: string | null
  withParent?: boolean
  withChildren?: boolean
  page?: number
  limit?: number
}
