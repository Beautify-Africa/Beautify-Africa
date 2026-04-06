export default function NavbarDesktopLinks({ links, onLinkClick }) {
  return (
    <ul className="hidden lg:flex items-center gap-14 text-[10px] uppercase tracking-[0.4em] font-bold text-stone-600">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={`#${link.id}`}
            onClick={(event) => onLinkClick(event, link.id)}
            className="group relative transition-colors hover:text-amber-800"
          >
            {link.name}
            <span
              className="absolute -bottom-1 left-0 h-[1px] w-0 bg-amber-800 transition-all duration-500 group-hover:w-full"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
