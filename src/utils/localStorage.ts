import { Entry } from '../types';

const CITIES_KEY = 'musa_traders_cities_v2';
const ENTRIES_KEY = 'musa_traders_entries_v2';

const DEFAULT_CITIES = [
  'Mandi Bahaudin', 'Okara', 'Main Bazar Sialkot', 'Warehouse Gujranwala',
  'Bhalwal', 'Sheikhupura', 'Muslim Bazar Sialkot', 'Dharyala Jalap',
  'Kotla Arab Ali Khan', 'Dina', 'Gujrat', 'Burewala', 'Sargodha',
  'Ghakhar', 'Vehari', 'Narowal', 'Hazro', 'Pound Store Kamalia',
  'Renala Khurd', 'Mirpur', 'Yousaf Mall Sialkot', 'Gojra (Faisalabad)',
  'Pound Store Sambrial', 'Raja Atif Kasur Awais Shah', 'Khurana Ada',
  'Dena Dollar Store', 'Vehari (Saeed Shah)'
];

const getMockEntries = (): Entry[] => {
  // We use dates relative to July 17, 2026 to populate nice metrics
  return [
    {
      id: 'mock-1',
      date: '2026-07-17',
      name: 'Main Bazar Sialkot',
      amount: 45000,
      type: 'sale'
    },
    {
      id: 'mock-2',
      date: '2026-07-17',
      name: 'Muslim Bazar Sialkot',
      amount: 32000,
      type: 'sale'
    },
    {
      id: 'mock-3',
      date: '2026-07-16',
      name: 'Mandi Bahaudin',
      amount: 58000,
      type: 'sale'
    },
    {
      id: 'mock-4',
      date: '2026-07-15',
      name: 'Okara',
      amount: 67000,
      type: 'sale'
    },
    // Received amounts
    {
      id: 'mock-5',
      date: '2026-07-17',
      name: 'Warehouse Gujranwala',
      amount: 40000,
      type: 'received'
    },
    {
      id: 'mock-6',
      date: '2026-07-16',
      name: 'Sargodha',
      amount: 55000,
      type: 'received'
    },
    {
      id: 'mock-7',
      date: '2026-07-15',
      name: 'Gujrat',
      amount: 60000,
      type: 'received'
    },
    // Payments
    {
      id: 'mock-8',
      date: '2026-07-17',
      name: 'Zain Accounting',
      amount: 25000,
      type: 'payment'
    },
    {
      id: 'mock-9',
      date: '2026-07-16',
      name: 'Imran (Logistics)',
      amount: 15000,
      type: 'payment'
    },
    {
      id: 'mock-10',
      date: '2026-07-15',
      name: 'Arslan Distributors',
      amount: 35000,
      type: 'payment'
    }
  ];
};

export const loadCitiesFromStorage = (): string[] => {
  try {
    const raw = localStorage.getItem(CITIES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load cities from local storage', e);
  }
  localStorage.setItem(CITIES_KEY, JSON.stringify(DEFAULT_CITIES));
  return [...DEFAULT_CITIES];
};

export const saveCitiesToStorage = (cities: string[]): void => {
  try {
    localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
  } catch (e) {
    console.error('Failed to save cities to local storage', e);
  }
};

export const loadEntriesFromStorage = (): Entry[] => {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load entries from local storage', e);
  }
  const mocks = getMockEntries();
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(mocks));
  return mocks;
};

export const saveEntriesToStorage = (entries: Entry[]): void => {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save entries to local storage', e);
  }
};
