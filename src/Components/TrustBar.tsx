import React from 'react';

const trustItems = [
  {
    label: "Ethically Sourced",
    image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=1000&auto=format&fit=crop",
    desc: "True luxury respects its roots. We maintain direct partnerships with sustainable growers and certified suppliers across the globe to ensure that every botanical ingredient is harvested with integrity. Our sourcing protocols prioritize fair labor practices, community support, and the preservation of biodiversity, ensuring that our footprint is as light as our finishes.",
    className: "md:col-span-2 md:row-span-2"
  },
  {
    label: "Dermatologist Tested",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
    desc: "Your skin’s health is our primary canvas. Every Éclat masterpiece undergoes rigorous clinical assessment and sensitivity testing under strict dermatological supervision. We prioritize hypoallergenic, non-comedogenic formulations that deliver visible results while respecting and protecting the delicate moisture barrier of even the most sensitive skin types.",
    className: "md:col-span-1 md:row-span-2"
  },
  {
    label: "Cruelty-Free",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop",
    desc: "We believe that true beauty should never come at the cost of another living being. Our commitment to cruelty-free practices is absolute and verified; we do not conduct, commission, or allow animal testing at any stage of our product development—from raw ingredient selection to the final finished formula. We are proud to be a voice for ethical standards in the modern beauty industry.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    label: "Vegan Formulation",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop",
    desc: "Our formulas are crafted exclusively using high-performance botanical extracts and safe synthetic innovations. We rigorously exclude all animal-derived ingredients—including common additives like lanolin, beeswax, and carmine—to deliver a pure, potent experience. This ensures our products are not only kind to the earth but also suitable for every lifestyle and ethical choice.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    label: "Global Shipping",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    desc: "Distance should never be a barrier to elegance. We are pleased to offer complimentary, carbon-neutral shipping on all orders worldwide. Your curated selection is packaged with sustainable materials and tracked every step of the way, ensuring it arrives at your doorstep with the same care and attention to detail as the products within.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    label: "Satisfaction Guarantee",
    image: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=1200&auto=format&fit=crop",
    desc: "We understand that skincare is a personal journey. We invite you to experience the Éclat ritual entirely risk-free. If a product does not perfectly complement your skin or meet your exacting standards, simply return it within 60 days for a full refund or a personalized exchange recommendation—no questions asked.",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    label: "24/7 Customer Support",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
    desc: "Our dedication to your experience does not end at checkout. Our team of expert beauty advisors is available around the clock to assist with personalized product recommendations, application tips, or order inquiries. Whether it is a midnight skincare query or an urgent delivery update, we are always here to ensure your journey with us is seamless and supported.",
    className: "md:col-span-2 md:row-span-1"
  }
];

const TrustBar: React.FC = () => {
  return (
    <section className="relative z-10 py-24 px-6 md:px-12 bg-[#faf9f6]">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 auto-rows-[300px]">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className={`group relative overflow-hidden rounded-3xl shadow-sm hover:shadow-2xl hover:z-10 hover:scale-[1.02] transition-all duration-500 ease-out cursor-default border border-stone-200/50 ${item.className}`}
            >
              {/* Background Image - Scales slowly on hover */}
              <div className="absolute inset-0 bg-stone-200">
                 <img 
                  src={item.image} 
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 opacity-95 group-hover:opacity-100"
                  loading="lazy"
                />
              </div>

              {/* Overlay Gradient - Adds blur and darkens on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent transition-all duration-500 group-hover:bg-stone-900/60 group-hover:backdrop-blur-sm"></div>
              
              {/* Content Container - Centered Alignment */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center">
                {/* Accent Line */}
                <div className="w-12 h-0.5 bg-amber-500 mb-6 transition-all duration-500 group-hover:scale-x-150 group-hover:bg-amber-400"></div>
                
                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-serif text-white font-medium tracking-wide mb-2 drop-shadow-md transform transition-transform duration-500 group-hover:-translate-y-2">
                  {item.label}
                </h3>
                
                {/* Long Description - Bigger Font, Sans-Serif */}
                <div className="overflow-hidden max-h-0 group-hover:max-h-[500px] transition-all duration-700 ease-in-out w-full">
                  <p className="text-stone-100 text-sm md:text-base font-sans font-light leading-relaxed tracking-wide opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    {item.desc}
                  </p>
                </div>
                
                {/* Decorative Icon for interaction hint */}
                <div className="absolute top-6 right-6 opacity-60 group-hover:opacity-0 transition-all duration-300">
                   <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
