import HeroSection from '@/components/home/HeroSection'
import CategorySection from '@/components/home/CategorySection'
import CompanySection from '@/components/home/CompanySection'
import HowItWorks from '@/components/home/HowItWorks'
import BusinessCTA from '@/components/home/BusinessCTA'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategorySection />
      <CompanySection />
      <HowItWorks />
      <BusinessCTA />
    </div>
  )
}
