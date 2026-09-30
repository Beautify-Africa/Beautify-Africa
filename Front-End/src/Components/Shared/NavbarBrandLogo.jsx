import { Link } from 'react-router-dom';

export default function NavbarBrandLogo({ brandName }) {
  return (
    <div className="flex-1 flex justify-start">
      <Link
        to="/"
        className="group text-2xl font-serif font-bold tracking-[0.2em] text-stone-900 md:text-3xl"
        aria-label={`${brandName} - Home`}
      >
        BEAUT
        <span className="relative inline-block">
          I
          <span
            className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
        </span>
        FY
      </Link>
    </div>
  );
}
