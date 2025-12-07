import { useEffect } from 'react';
import Hero from './components/Hero';
import Partners from './components/Partners';
import PainPoints from './components/PainPoints';
import Solution from './components/Solution';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import './Landing.css';

const Landing = () => {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Partners />
      <PainPoints />
      <Solution />
      <Features />
      <HowItWorks />
      {/* <Testimonials /> - Temporairement caché, sera réintégré plus tard */}
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
