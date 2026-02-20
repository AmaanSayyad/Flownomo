import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './TrueFocus.css';

interface TrueFocusProps {
    sentence?: string;
    separator?: string;
    manualMode?: boolean;
    blurAmount?: number;
    borderColor?: string;
    glowColor?: string;
    animationDuration?: number;
    pauseBetweenAnimations?: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
    sentence = 'True Focus',
    separator = ' ',
    manualMode = false,
    blurAmount = 5,
    borderColor = '#fff',
    glowColor = 'rgba(255, 255, 255, 0.6)',
    animationDuration = 0.5,
    pauseBetweenAnimations = 1
}) => {
    const words = sentence.split(separator);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const updateFocusRect = () => {
        if (currentIndex === null || currentIndex === -1) return;
        if (!wordRefs.current[currentIndex] || !containerRef.current) return;

        const parentRect = containerRef.current.getBoundingClientRect();
        const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

        setFocusRect({
            x: activeRect.left - parentRect.left,
            y: activeRect.top - parentRect.top,
            width: activeRect.width,
            height: activeRect.height
        });
    };

    useEffect(() => {
        if (!manualMode) {
            const interval = setInterval(
                () => {
                    setCurrentIndex(prev => (prev + 1) % words.length);
                },
                (animationDuration + pauseBetweenAnimations) * 1000
            );

            return () => clearInterval(interval);
        }
    }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

    useEffect(() => {
        updateFocusRect();

        // Robust layout tracking
        const resizeObserver = new ResizeObserver(() => {
            updateFocusRect();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Multiple triggers to ensure catch-up after fonts load or parent animations finish
        const timers = [
            setTimeout(updateFocusRect, 100),
            setTimeout(updateFocusRect, 500),
            setTimeout(updateFocusRect, 1000),
            setTimeout(updateFocusRect, 2000)
        ];

        window.addEventListener('resize', updateFocusRect);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateFocusRect);
            timers.forEach(clearTimeout);
        };
    }, [currentIndex]);

    const handleMouseEnter = (index: number) => {
        if (manualMode) {
            setLastActiveIndex(index);
            setCurrentIndex(index);
        }
    };

    const handleMouseLeave = () => {
        if (manualMode) {
            setCurrentIndex(lastActiveIndex ?? 0);
        }
    };

    return (
        <div className="focus-container" ref={containerRef}>
            {words.map((word, index) => {
                const isActive = index === currentIndex;
                return (
                    <span
                        key={index}
                        ref={el => { wordRefs.current[index] = el; }}
                        className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
                        style={{
                            filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
                            // @ts-ignore
                            '--border-color': borderColor,
                            // @ts-ignore
                            '--glow-color': glowColor,
                            transition: `filter ${animationDuration}s ease`
                        }}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {word}
                    </span>
                );
            })}

            <motion.div
                className="focus-frame"
                animate={{
                    x: focusRect.x,
                    y: focusRect.y,
                    width: focusRect.width,
                    height: focusRect.height,
                    opacity: currentIndex >= 0 ? 1 : 0
                }}
                transition={{
                    duration: animationDuration,
                    ease: "easeInOut"
                }}
                style={{
                    // @ts-ignore
                    '--border-color': borderColor,
                    // @ts-ignore
                    '--glow-color': glowColor
                }}
            >
                <span className="corner top-left"></span>
                <span className="corner top-right"></span>
                <span className="corner bottom-left"></span>
                <span className="corner bottom-right"></span>
            </motion.div>
        </div>
    );
};

export default TrueFocus;
