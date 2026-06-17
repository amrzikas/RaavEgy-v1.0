import { Product } from './types';

export const PRESET_COLORS = [
  { labelAr: 'أسود كربون', labelEn: 'Carbon Black', hex: '#111111' },
  { labelAr: 'أبيض ناصع', labelEn: 'Pure White', hex: '#FFFFFF' },
  { labelAr: 'بيج كلاسيك', labelEn: 'Classic Beige', hex: '#E6D3B8' },
  { labelAr: 'أزرق كحلي', labelEn: 'Navy Blue', hex: '#1D2A44' },
  { labelAr: 'أحمر قاني', labelEn: 'Crimson Red', hex: '#8C2222' },
  { labelAr: 'أخضر زيتوني', labelEn: 'Olive Green', hex: '#4A5D4E' },
  { labelAr: 'رمادي حجري', labelEn: 'Stone Gray', hex: '#7E858B' },
  { labelAr: 'جملي دافئ', labelEn: 'Warm Camel', hex: '#C19A6B' },
  { labelAr: 'خردلي ذهبي', labelEn: 'Mustard Gold', hex: '#E1AD01' },
  { labelAr: 'وردي ناعم', labelEn: 'Soft Rose', hex: '#FFC0CB' },
];

export function getProductPrice(prod: Product) {
  if (!prod) return { current: 0, original: 0, hasDiscount: false };

  // If the product doesn't have a valid base price
  const basePrice = Number(prod.price) || 0;

  if (prod.discountPrice && Number(prod.discountPrice) < basePrice) {
    const todayStr = new Date().toISOString().split('T')[0]; // "2026-06-17"
    
    let isBetween = true;
    if (prod.discountStart && todayStr < prod.discountStart) {
      isBetween = false;
    }
    if (prod.discountEnd && todayStr > prod.discountEnd) {
      isBetween = false;
    }

    if (isBetween) {
      return {
        current: Number(prod.discountPrice),
        original: basePrice,
        hasDiscount: true
      };
    }
  }

  return {
    current: basePrice,
    original: basePrice,
    hasDiscount: false
  };
}
