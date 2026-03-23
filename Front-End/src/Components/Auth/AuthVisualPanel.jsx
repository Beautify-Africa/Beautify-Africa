import { AUTH_IMAGE } from '../../data/authContent';

export default function AuthVisualPanel() {
  return (
    <div
      className="relative flex min-h-[250px] w-full items-end bg-cover bg-center md:min-h-0 md:w-1/2"
      style={{ backgroundImage: `url(${AUTH_IMAGE.src})` }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"
        aria-hidden="true"
      />

      <figure className="relative z-10 w-full p-8 text-white md:p-12">
        <blockquote className="mb-4 font-serif text-2xl italic leading-tight md:text-3xl">
          {AUTH_IMAGE.quote}
        </blockquote>
        <div className="mb-4 h-[1px] w-12 bg-white/50" aria-hidden="true" />
        <figcaption className="text-[10px] uppercase tracking-[0.3em] opacity-80">
          {AUTH_IMAGE.attribution}
        </figcaption>
      </figure>
    </div>
  );
}
