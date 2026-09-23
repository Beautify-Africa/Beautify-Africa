import { Link } from 'react-router-dom';
import { sanitizeUrl } from '@/utils/sanitize';

function isExternalHref(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

export default function AppLink({ href, children, rel, target, ...props }) {
  if (!href) {
    return <span {...props}>{children}</span>;
  }

  const safeHref = sanitizeUrl(href);

  if (isExternalHref(safeHref) || safeHref.startsWith('#') || target === '_blank') {
    const resolvedRel = target === '_blank' ? rel || 'noopener noreferrer' : rel;

    return (
      <a href={safeHref} rel={resolvedRel} target={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={safeHref} {...props}>
      {children}
    </Link>
  );
}
