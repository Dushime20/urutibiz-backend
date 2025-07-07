import { v4 as uuidv4 } from 'uuid';

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
