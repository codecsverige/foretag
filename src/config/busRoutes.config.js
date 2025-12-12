// Configuration for bus routes - completely separate from rides
export const BUS_ROUTES_CONFIG = {
  collection: 'busRoutes', // New collection, won't affect 'rides'
  
  // Bus companies whitelist
  allowedCompanies: [
    'FlixBus',
    'Vy Buss',
    'Nettbuss',
    'Svenska Buss'
  ],
  
  // Available amenities
  amenities: {
    wifi: { icon: '🛜', label: 'WiFi' },
    ac: { icon: '❄️', label: 'Luftkonditionering' },
    toilet: { icon: '🚻', label: 'Toalett' },
    power: { icon: '🔌', label: 'Eluttag' },
    luggage: { icon: '🧳', label: 'Bagageutrymme' },
    accessible: { icon: '♿', label: 'Rullstolsanpassad' },
    snacks: { icon: '🍿', label: 'Snacks ombord' },
    entertainment: { icon: '📺', label: 'Underhållning' }
  },
  
  // Cities for dropdown
  cities: [
    'Stockholm',
    'Göteborg',
    'Malmö',
    'Uppsala',
    'Västerås',
    'Örebro',
    'Linköping',
    'Helsingborg',
    'Jönköping',
    'Norrköping',
    'Lund',
    'Umeå',
    'Gävle',
    'Borås',
    'Eskilstuna',
    'Södertälje',
    'Karlstad',
    'Täby',
    'Växjö',
    'Halmstad'
  ]
};

// Bus route data structure
export const createBusRoute = () => ({
  // Basic info
  company: '',
  from: '',
  to: '',
  // Legacy string fields kept for UI inputs; backend will write Timestamps
  departureTime: '',
  arrivalTime: '',
  // New Timestamp fields for querying/sorting
  departureAt: null,
  arrivalAt: null,
  // UI date for building departureAt/arrivalAt
  date: '',
  duration: '',
  price: 0,
  currency: 'SEK',
  
  // Capacity
  totalSeats: 50,
  availableSeats: 50,
  
  // Amenities
  amenities: [],
  
  // Booking
  bookingUrl: '',
  busNumber: '',
  
  // Metadata
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  status: 'active', // active, cancelled, full
  
  // Type identifier
  type: 'bus'
});