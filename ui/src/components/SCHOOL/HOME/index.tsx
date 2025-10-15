// import { Navigation } from "../navigation"
import { HeroSection } from "../hero-section"
import { FeaturesSection } from "../features-section"
import { AboutSection } from "../about-section"
import { ContactSection } from "../contact-section"

export default function SchoolHomePage() {
  return (
    <div className="min-h-screen ">
      {/* <Navigation /> */}
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <ContactSection />
    </div>
  )
}
