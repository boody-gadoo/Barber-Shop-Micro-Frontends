import { ServiceCategory } from '@shared-types/core';
import { BookingService } from '../models/booking.model';

/**
 * Mock services data
 */
export const MOCK_SERVICES: BookingService[] = [
  {
    id: 'service-001',
    name: 'Classic Haircut',
    nameAr: 'قص شعر كلاسيكي',
    category: ServiceCategory.HAIRCUT,
    durationMinutes: 30,
    price: 50,
    description: 'Traditional Egyptian barber haircut with classic styling',
  },
  {
    id: 'service-002',
    name: 'Fade Cut',
    nameAr: 'قص فيد',
    category: ServiceCategory.HAIRCUT,
    durationMinutes: 30,
    price: 60,
    description: 'Modern fade haircut with precision blending',
  },
  {
    id: 'service-003',
    name: 'Beard Shave',
    nameAr: 'حلاقة لحية',
    category: ServiceCategory.HOT_TOWEL_SHAVE,
    durationMinutes: 20,
    price: 40,
    description: 'Professional beard shave with hot towel finish',
  },
  {
    id: 'service-004',
    name: 'Beard Trim',
    nameAr: 'تشذيب اللحية',
    category: ServiceCategory.BEARD_TRIM,
    durationMinutes: 15,
    price: 25,
    description: 'Beard shape and trim',
  },
  {
    id: 'service-005',
    name: 'Haircut + Shave',
    nameAr: 'قص شعر وحلاقة',
    category: ServiceCategory.HAIR_BEARD,
    durationMinutes: 50,
    price: 80,
    description: 'Complete grooming package: haircut and shave',
  },
  {
    id: 'service-006',
    name: 'Premium Grooming',
    nameAr: 'عناية فاخرة',
    category: ServiceCategory.STYLING,
    durationMinutes: 60,
    price: 120,
    description: 'Full grooming experience with hair wash and conditioning',
  },
];
