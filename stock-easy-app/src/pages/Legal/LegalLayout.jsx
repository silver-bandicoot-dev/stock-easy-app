import React from 'react';
import Navbar from '../Landing/components/Navbar';
import Footer from '../Landing/components/Footer';

const LegalLayout = ({ children, title, lastUpdated }) => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      <Navbar isLegalPage={true} />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12 border-b border-[#E5E4DF] pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#191919] mb-4 font-display">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-[#191919]/60">
                Dernière mise à jour : {lastUpdated}
              </p>
            )}
          </div>
          
          <div className="prose prose-stone max-w-none prose-headings:font-display prose-a:text-[#191919] prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalLayout;

