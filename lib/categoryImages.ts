// Professional category images from Unsplash (free to use)
// Real photos for each cleaning and service category

export const categoryImagePool: Record<string, string[]> = {
  // === STÄDNING (Cleaning) - Main category ===
  stadning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', // Person cleaning floor with mop
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80', // Professional cleaner with supplies
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80', // Cleaning spray and cloth
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80', // Vacuum cleaning
  ],

  // Hemstädning (Home cleaning) - vacuum, mop, living room
  hemstadning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', // Person mopping floor
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80', // Clean modern living room
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', // Cleaning supplies bucket
  ],

  // Storstädning (Deep cleaning) - intensive cleaning
  storstadning: [
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80', // Professional deep cleaning
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80', // Spray and scrub
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80', // Deep cleaning equipment
  ],

  // Flyttstädning (Move-out cleaning) - empty apartment
  flyttstadning: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', // Empty clean apartment
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', // Clean empty room
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80', // Spotless kitchen
  ],

  // Kontorsstädning (Office cleaning) - office space
  kontorsstadning: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', // Modern clean office
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&q=80', // Office workspace
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80', // Clean office desk
  ],

  // Trappstädning (Stairway cleaning) - stairs, hallway
  trappstadning: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80', // Clean stairway
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', // Building hallway
  ],

  // Byggstädning (Construction cleaning) - post-construction
  byggstadning: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', // Construction site
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80', // Worker cleaning
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', // Construction tools
  ],

  // Fönsterputs (Window cleaning) - windows, glass
  fonsterputs: [
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80', // Window cleaning
    'https://images.unsplash.com/photo-1596263373265-bae1e9d52f3e?w=600&q=80', // Clean windows
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', // Sparkling glass
  ],

  // Visningsstädning (Viewing/showing cleaning)
  visningsstadning: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', // Pristine apartment
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', // Show-ready room
  ],

  // Golvvård (Floor care)
  golvvard: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', // Floor mopping
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80', // Shiny floor
  ],

  // Mattvätt (Carpet cleaning)
  mattvatt: [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80', // Clean carpet
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', // Carpet cleaning
  ],

  // Sotning (Chimney sweep)
  sotning: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80', // Fireplace
  ],

  // === FLYTT (Moving) ===
  packning: [
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80', // Packing boxes
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=600&q=80', // Moving boxes
  ],
  flytt: [
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80', // Moving truck loading
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=600&q=80', // Moving boxes
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80', // Delivery van
  ],
  flytthjalp: [
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80', // Loading boxes
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=600&q=80', // Moving help
  ],
  'flytt-stadning': [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', // Clean empty apartment
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80', // Move out
  ],
  transport: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80', // Delivery truck
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80', // Transport
  ],
  bortforsling: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', // Waste removal
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=600&q=80', // Junk removal
  ],

  // === HANTVERK (Handyman) ===
  hantverk: [
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80', // Handyman tools
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', // Tool belt
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', // Home repair
  ],
  montering: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', // Assembly work
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=600&q=80', // Furniture assembly
  ],
  snickeri: [
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80', // Carpentry
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', // Woodwork
  ],
  el: [
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=600&q=80', // Electrical work
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', // Electrician
  ],
  vvs: [
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', // Plumbing
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80', // Pipes
  ],
  malning: [
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80', // Painting walls
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80', // Paint roller
  ],
  tapetsering: [
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80', // Wallpaper
  ],

  // === HEM & FASTIGHET (Home & Property) ===
  'hem-fastighet': [
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80', // House exterior
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', // Garden
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80', // Property
  ],
  grasklippning: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', // Lawn mowing
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80', // Green lawn
  ],
  snoskottning: [
    'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=600&q=80', // Snow removal
    'https://images.unsplash.com/photo-1547754980-3df97fed72a8?w=600&q=80', // Snowy path
  ],
  tradgardsarbete: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', // Garden work
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80', // Gardening
  ],
  fastighetsskotsel: [
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80', // Property care
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80', // Building maintenance
  ],

  // === OTHER ===
  annat: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', // General services
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80', // Business
  ],
}

export const defaultImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'

// Get consistent image based on company ID (hash)
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getCategoryImage(categoryId?: string, companyId?: string): string {
  if (!categoryId) return defaultImage
  const images = categoryImagePool[categoryId]
  if (!images || images.length === 0) return defaultImage
  
  // Use company ID to pick consistent image
  const index = companyId ? hashCode(companyId) % images.length : 0
  return images[index]
}

export const categoryNames: Record<string, string> = {
  frisor: 'Frisör & Skönhet',
  massage: 'Massage & Spa',
  stadning: 'Städning',
  flytt: 'Flytt & Transport',
  hantverk: 'Hantverk & Småjobb',
  'hem-fastighet': 'Hem & Fastighet',
  bil: 'Bil & Motor',
  halsa: 'Hälsa & Sjukvård',
  restaurang: 'Restaurang & Café',
  fitness: 'Träning & Fitness',
  utbildning: 'Utbildning & Kurser',
  djur: 'Djur & Husdjur',
  it: 'IT & Teknik',
  annat: 'Övrigt',
}
