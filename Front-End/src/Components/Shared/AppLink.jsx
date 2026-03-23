import { Link } from 'react-router-dom';

function isExternalHref(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

export default function AppLink({ href, children, rel, target, ...props }) {
  if (!href) {
    return <span {...props}>{children}</span>;
  }

  if (isExternalHref(href) || href.startsWith('#') || target === '_blank') {
    const resolvedRel = target === '_blank' ? rel || 'noopener noreferrer' : rel;

    return (
      <a href={href} rel={resolvedRel} target={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} {...props}>
      {children}
    </Link>
  );
}
