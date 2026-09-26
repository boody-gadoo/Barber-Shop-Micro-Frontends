import { ServiceCategory } from '@shared-types/core';
import { Barber } from '../models/booking.model';

/**
 * Mock barber data
 */
export const MOCK_BARBERS: Barber[] = [
  {
    id: 'barber-001',
    name: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    specialty: ServiceCategory.HAIRCUT,
    rating: 4.8,
    imageUrl: '/portrait1.jpg',
    availability: [
      {
        date: '2025-01-15',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '10:30',
        endTime: '11:00',
        durationMinutes: 30,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        available: false,
      },
      {
        date: '2025-01-15',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        available: true,
      },
      {
        date: '2025-01-16',
        startTime: '09:00',
        endTime: '09:30',
        durationMinutes: 30,
        available: true,
      },
      {
        date: '2025-01-16',
        startTime: '09:30',
        endTime: '10:00',
        durationMinutes: 30,
        available: true,
      },
      {
        date: '2025-01-16',
        startTime: '15:00',
        endTime: '15:30',
        durationMinutes: 30,
        available: true,
      },
    ],
  },
  {
    id: 'barber-002',
    name: 'Mohammed Ali',
    nameAr: 'محمد علي',
    specialty: ServiceCategory.HOT_TOWEL_SHAVE,
    rating: 4.9,
    imageUrl: '/portrait2.jpg',
    availability: [
      {
        date: '2025-01-15',
        startTime: '10:00',
        endTime: '10:20',
        durationMinutes: 20,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '10:20',
        endTime: '10:40',
        durationMinutes: 20,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '11:00',
        endTime: '11:20',
        durationMinutes: 20,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '14:30',
        endTime: '14:50',
        durationMinutes: 20,
        available: false,
      },
      {
        date: '2025-01-16',
        startTime: '09:00',
        endTime: '09:20',
        durationMinutes: 20,
        available: true,
      },
      {
        date: '2025-01-16',
        startTime: '16:00',
        endTime: '16:20',
        durationMinutes: 20,
        available: true,
      },
    ],
  },
  {
    id: 'barber-003',
    name: 'Ibrahim Nasser',
    nameAr: 'إبراهيم ناصر',
    specialty: ServiceCategory.HAIR_BEARD,
    rating: 4.7,
    imageUrl: '/portrait3.jpg',
    availability: [
      {
        date: '2025-01-15',
        startTime: '10:00',
        endTime: '10:50',
        durationMinutes: 50,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '11:00',
        endTime: '11:50',
        durationMinutes: 50,
        available: true,
      },
      {
        date: '2025-01-15',
        startTime: '15:00',
        endTime: '15:50',
        durationMinutes: 50,
        available: false,
      },
      {
        date: '2025-01-16',
        startTime: '09:00',
        endTime: '09:50',
        durationMinutes: 50,
        available: true,
      },
    ],
  },
];
