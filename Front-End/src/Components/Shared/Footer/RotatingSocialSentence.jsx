import { useEffect, useState } from 'react';
import {
  ROTATING_SOCIAL_SENTENCE,
  SOCIAL_ROTATION_CONFIG,
} from '../../../data/footerContent';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { FOOTER_SOCIAL_ICONS } from './footerSocialIcons';

export default function RotatingSocialSentence() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    let transitionTimeoutId;
    const intervalId = window.setInterval(() => {
      setVisible(false);

      transitionTimeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % FOOTER_SOCIAL_ICONS.length);
        setVisible(true);
      }, SOCIAL_ROTATION_CONFIG.transitionMs);
    }, SOCIAL_ROTATION_CONFIG.intervalMs);

    return () => {
      window.clearInterval(intervalId);
      if (transitionTimeoutId) {
        window.clearTimeout(transitionTimeoutId);
      }
    };
  }, [prefersReducedMotion]);

  const current = FOOTER_SOCIAL_ICONS[index];
  const { Icon } = current;

  return (
    <p className="font-serif italic text-base leading-relaxed text-stone-400 md:text-lg">
      {ROTATING_SOCIAL_SENTENCE.prefix}{' '}
      <a
        href={current.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${current.name}`}
        className="group relative mx-1 inline-flex items-center justify-center align-middle"
      >
        <span
          style={{
            color: current.color,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.7)',
            transition: 'opacity 0.4s ease, transform 0.4s ease, filter 0.3s ease',
            display: 'inline-flex',
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        >
          <Icon className="h-5 w-5 transition-colors duration-300 md:h-6 md:w-6" />
        </span>
        <span
          className="absolute -bottom-0.5 left-0 h-[1px] w-0 transition-all duration-300 group-hover:w-full"
          style={{ backgroundColor: current.color }}
          aria-hidden="true"
        />
      </a>{' '}
      {ROTATING_SOCIAL_SENTENCE.suffix}
    </p>
  );
}
