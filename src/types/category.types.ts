export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  iconName?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
}
