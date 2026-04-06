import AppLink from '../AppLink';

export default function FooterNavColumn({ section, isFirst }) {
  const columnClass = isFirst ? 'lg:col-span-2 lg:col-start-6' : 'lg:col-span-2';

  return (
    <nav className={columnClass} aria-labelledby={section.id}>
      <h4
        id={section.id}
        className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#faf9f6] md:mb-10 md:text-xs"
      >
        {section.title}
      </h4>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-1 md:gap-5">
        {section.links.map((link) => (
          <li key={link.name}>
            <AppLink
              href={link.href}
              className="inline-block text-[13px] font-light transition-all duration-300 hover:pl-2 hover:text-[#faf9f6] md:text-sm"
            >
              {link.name}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
