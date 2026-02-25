import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus within a container while active.
 * Usage: const ref = useFocusTrap(isOpen);
 */
export function useFocusTrap(isActive) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const FOCUSABLE = [
            'a[href]', 'button:not([disabled])', 'input:not([disabled])',
            'select:not([disabled])', 'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE));

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusable();
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        // Focus first focusable element when trap activates
        const focusable = getFocusable();
        if (focusable.length > 0) focusable[0].focus();

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}
