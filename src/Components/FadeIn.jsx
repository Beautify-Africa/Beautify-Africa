import { motion } from 'framer-motion';

/**
 * FadeIn Component
 *
 * A reusable wrapper component that adds a fade-in animation to its children
 * when they enter the viewport. Supports semantic HTML elements.
 *
 * @param {React.ReactNode} children - The content to animate.
 * @param {string} as - The HTML element to render ('div', 'section', 'article', 'header', 'aside', 'figure', 'nav', 'footer', 'main', 'span').
 * @param {number} delay - Delay before animation starts (in seconds).
 * @param {number} duration - Duration of the animation (in seconds).
 * @param {string} direction - Direction of the slide ('up', 'down', 'left', 'right', 'none').
 * @param {boolean} fullWidth - Whether the container should take up full width.
 * @param {string} className - Additional classes for the container.
 * @param {object} viewport - Custom viewport options (e.g. { once: true, margin: "-100px" }).
 */
const FadeIn = ({
    children,
    as = 'div',
    delay = 0,
    duration = 0.5,
    direction = 'up',
    fullWidth = false,
    className = '',
    viewport = { once: false, margin: '-50px' },
    ...props
}) => {
    const directions = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
        none: { x: 0, y: 0 },
    };

    const initial = {
        opacity: 0,
        ...directions[direction],
    };

    const whileInView = {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
            duration,
            delay,
            ease: [0.25, 0.1, 0.25, 1.0],
        },
    };

    // Create the motion component dynamically based on the 'as' prop
    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            initial={initial}
            whileInView={whileInView}
            viewport={viewport}
            className={`${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </MotionComponent>
    );
};

export default FadeIn;
