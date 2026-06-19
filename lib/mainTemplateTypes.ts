export type PopupType = 'offers' | 'new_arrivals'

export interface HomeSlide {
  id: string
  image: string
  badge: string
  title: string
  description: string
  linkUrl: string
  buttonText: string
}

export interface HomeHero {
  title: string
  subtitle: string
  image: string
  primaryButtonText: string
  primaryButtonUrl: string
  secondaryButtonText: string
  secondaryButtonUrl: string
}

export interface HomePopup {
  enabled: boolean
  type: PopupType
  image: string
  title: string
  subtitle: string
  buttonText: string
  linkUrl: string
}

export interface MainTemplate {
  slides: HomeSlide[]
  hero: HomeHero
  popup: HomePopup
}

export const DEFAULT_MAIN_TEMPLATE: MainTemplate = {
  slides: [
    {
      id: 'slide-1',
      image: '/images/drone-sentinel-pro.png',
      badge: 'Featured Collection',
      title: 'Sentinel Pro 4K',
      description: 'Advanced surveillance drone with 4K thermal imaging for defense professionals.',
      linkUrl: '/product/1',
      buttonText: 'View Product',
    },
    {
      id: 'slide-2',
      image: '/images/drone-guardian-x500.png',
      badge: 'Top Rated',
      title: 'Guardian X500',
      description: 'Heavy-lift tactical drone built for extended missions and payload delivery.',
      linkUrl: '/product/2',
      buttonText: 'View Product',
    },
    {
      id: 'slide-3',
      image: '/images/drone-viper-3000.png',
      badge: 'New Arrival',
      title: 'Viper 3000',
      description: 'High-speed reconnaissance platform with encrypted data transmission.',
      linkUrl: '/product/3',
      buttonText: 'View Product',
    },
  ],
  hero: {
    title: 'NEW ARRIVALS: Advanced Defense & Surveillance Drones',
    subtitle:
      'Professional-grade unmanned systems for military, defense, and industrial applications. Precision engineering meets cutting-edge technology.',
    image: '/images/drone-sentinel-pro.png',
    primaryButtonText: 'Shop Now',
    primaryButtonUrl: '/shop',
    secondaryButtonText: 'Learn More',
    secondaryButtonUrl: '/about',
  },
  popup: {
    enabled: false,
    type: 'new_arrivals',
    image: '/images/drone-aurora.png',
    title: 'New Arrivals Are Here!',
    subtitle: 'Explore our latest defense drones with exclusive launch pricing.',
    buttonText: 'Shop New Arrivals',
    linkUrl: '/shop',
  },
}

export function createSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
