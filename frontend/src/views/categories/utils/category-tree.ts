import type { Category } from '@/domain/models/category.model'

export const ROOT_CATEGORY_VALUE = '__root__'

export interface CategoryParentOption {
  id: string
  label: string
  level: number
}

export type CategoryTableRow = Category & {
  level: number
  path: string
  parentName: string | null
}

export function buildCategoryTree(categories: Category[]) {
  const categoriesById = new Map<string, Category>()
  const roots: Category[] = []

  for (const category of categories) {
    categoriesById.set(category.id, { ...category, children: [] })
  }

  for (const category of categoriesById.values()) {
    if (!category.parentId) {
      roots.push(category)
      continue
    }

    const parent = categoriesById.get(category.parentId)
    if (!parent) {
      roots.push(category)
      continue
    }

    parent.children = [...(parent.children ?? []), category]
  }

  return sortCategoryTree(roots)
}

export function buildCategoryParentOptions(categories: Category[], currentId?: string | null): CategoryParentOption[] {
  const childrenByParent = groupChildrenByParent(categories, currentId)

  for (const children of childrenByParent.values()) {
    children.sort((current, next) => current.name.localeCompare(next.name))
  }

  return flattenParentOptions(childrenByParent, ROOT_CATEGORY_VALUE)
}

function sortCategoryTree(categories: Category[]): Category[] {
  return categories
    .sort((current, next) => current.name.localeCompare(next.name))
    .map((category) => ({
      ...category,
      children: sortCategoryTree(category.children ?? [])
    }))
}

export function flattenCategoryTree(categories: Category[], parentPath: string[] = [], level = 0): CategoryTableRow[] {
  return categories.flatMap((category) => {
    const path = [...parentPath, category.name]
    const row: CategoryTableRow = {
      ...category,
      level,
      path: path.join(' / '),
      parentName: parentPath.at(-1) ?? null
    }

    return [
      row,
      ...flattenCategoryTree(category.children ?? [], path, level + 1)
    ]
  })
}

export function getDescendantIds(categoryId: string | null | undefined, categories: Category[]) {
  const descendants = new Set<string>()

  if (!categoryId) {
    return descendants
  }

  const childrenByParent = groupIdsByParent(categories)
  const pending = [...(childrenByParent.get(categoryId) ?? [])]

  while (pending.length > 0) {
    const childId = pending.pop()
    if (!childId || descendants.has(childId)) {
      continue
    }

    descendants.add(childId)
    pending.push(...(childrenByParent.get(childId) ?? []))
  }

  return descendants
}

function groupChildrenByParent(categories: Category[], currentId?: string | null) {
  const childrenByParent = new Map<string, Category[]>()
  const blockedIds = getDescendantIds(currentId, categories)

  for (const category of categories) {
    if (category.id === currentId || blockedIds.has(category.id)) {
      continue
    }

    const parentId = category.parentId ?? ROOT_CATEGORY_VALUE
    const children = childrenByParent.get(parentId) ?? []
    children.push(category)
    childrenByParent.set(parentId, children)
  }

  return childrenByParent
}

function groupIdsByParent(categories: Category[]) {
  const childrenByParent = new Map<string, string[]>()

  for (const category of categories) {
    if (!category.parentId) {
      continue
    }

    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category.id)
    childrenByParent.set(category.parentId, children)
  }

  return childrenByParent
}

function flattenParentOptions(
  childrenByParent: Map<string, Category[]>,
  parentId: string,
  parentPath: string[] = [],
  level = 0
): CategoryParentOption[] {
  return (childrenByParent.get(parentId) ?? []).flatMap((category) => {
    const path = [...parentPath, category.name]

    return [
      {
        id: category.id,
        label: path.join(' / '),
        level
      },
      ...flattenParentOptions(childrenByParent, category.id, path, level + 1)
    ]
  })
}
