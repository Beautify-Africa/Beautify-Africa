import React from 'react';

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <nav className="flex items-center justify-between px-8 py-6 bg-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-amber-800 tracking-wide">Beautify Africa</h1>
        </div>
        <ul className="flex items-center gap-8">
          <li>
            <a href="#collection" className="text-gray-700 hover:text-amber-600 font-medium transition-colors duration-200">Collection</a>
          </li>
          <li>
            <a href="#regimen" className="text-gray-700 hover:text-amber-600 font-medium transition-colors duration-200">Regimen</a>
          </li>
          <li>
            <a href="#journal" className="text-gray-700 hover:text-amber-600 font-medium transition-colors duration-200">Journal</a>
          </li>
          <li>
            <a href="#society" className="text-gray-700 hover:text-amber-600 font-medium transition-colors duration-200">Society</a>
          </li>
        </ul>
      </nav>
    </section>
  );
};

export default HeroSection;

