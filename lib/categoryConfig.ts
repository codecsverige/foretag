// Category configuration with colors for gradient backgrounds
export const categoryConfig: Record<string, {
  name: string
  emoji: string
  gradient: string
  color: string
}> = {
  frisor: {
    name: 'Frisör',
    emoji: '💇',
    gradient: 'from-pink-500 to-rose-600',
    color: '#ec4899'
  },
  massage: {
    name: 'Massage',
    emoji: '💆',
    gradient: 'from-purple-500 to-indigo-600',
    color: '#8b5cf6'
  },
  stadning: {
    name: 'Städning',
    emoji: '🧼',
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06b6d4'
  },
  flytt: {
    name: 'Flytt & Transport',
    emoji: '🚚',
    gradient: 'from-slate-700 to-gray-900',
    color: '#334155'
  },
  hantverk: {
    name: 'Hantverk & Småjobb',
    emoji: '🔧',
    gradient: 'from-amber-500 to-orange-600',
    color: '#f59e0b'
  },
  'hem-fastighet': {
    name: 'Hem & Fastighet',
    emoji: '🏠',
    gradient: 'from-green-500 to-emerald-600',
    color: '#22c55e'
  },
  bil: {
    name: 'Bil & Motor',
    emoji: '🚗',
    gradient: 'from-slate-600 to-gray-800',
    color: '#475569'
  },
  halsa: {
    name: 'Hälsa',
    emoji: '🏥',
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10b981'
  },
  restaurang: {
    name: 'Restaurang',
    emoji: '🍽️',
    gradient: 'from-orange-500 to-red-600',
    color: '#f97316'
  },
  fitness: {
    name: 'Fitness',
    emoji: '💪',
    gradient: 'from-amber-500 to-orange-600',
    color: '#f59e0b'
  },
  utbildning: {
    name: 'Utbildning',
    emoji: '📚',
    gradient: 'from-blue-500 to-indigo-600',
    color: '#3b82f6'
  },
  djur: {
    name: 'Djur',
    emoji: '🐕',
    gradient: 'from-amber-600 to-yellow-700',
    color: '#d97706'
  },
  it: {
    name: 'IT-tjänster',
    emoji: '💻',
    gradient: 'from-violet-500 to-purple-700',
    color: '#7c3aed'
  },
  annat: {
    name: 'Övrigt',
    emoji: '📋',
    gradient: 'from-gray-500 to-slate-600',
    color: '#6b7280'
  }
}

export const defaultCategory = {
  name: 'Företag',
  emoji: '🏢',
  gradient: 'from-brand to-brand-dark',
  color: '#2563eb'
}

export function getCategoryConfig(categoryId?: string) {
  if (!categoryId) return defaultCategory
  return categoryConfig[categoryId] || defaultCategory
}
