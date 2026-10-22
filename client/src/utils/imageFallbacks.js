export const CATEGORY_FALLBACK_IMAGES = {
  Coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  Tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
  Snacks: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
  Desserts: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  Other: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
};

export const getCategoryFallbackImage = (category) => {
  if (!category) return CATEGORY_FALLBACK_IMAGES.Other;
  const key = Object.keys(CATEGORY_FALLBACK_IMAGES).find(
    (k) => k.toLowerCase() === String(category).toLowerCase()
  );
  return key ? CATEGORY_FALLBACK_IMAGES[key] : CATEGORY_FALLBACK_IMAGES.Other;
};

export const handleImageError = (e, category) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = getCategoryFallbackImage(category);
};

export default getCategoryFallbackImage;
