export function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getFirstName(name) {
  return name?.trim().split(/\s+/).filter(Boolean)[0] || 'Guest';
}

export function formatMemberSince(dateValue) {
  if (!dateValue) return 'Just now';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));
}
