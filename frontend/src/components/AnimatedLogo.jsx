import React from 'react';

const AnimatedLogo = ({ size = 120, style = {}, className = '', spinDuration = 20, spinDirection = 'normal', spinDelay = '0s', initialRotate = 0 }) => {
  const hexColor = '#447D9B'; // brand blue
  const circleColor = '#FE7743'; // brand orange
  const sz = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`mn-logo ${className}`.trim()}
      style={{
        position: 'absolute',
        opacity: 0.2,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        width: sz,
        height: sz,
        ...style,
      }}
    >
      <svg
        width={sz}
        height={sz}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <g style={{ transformOrigin: '50% 50%', transform: `rotate(${initialRotate}deg)` }}>
          <g style={{ transformOrigin: '50% 50%', animation: `mn-spin ${spinDuration}s linear infinite ${spinDelay}`, animationDirection: spinDirection }}>
          {/* Hexagonal outline */}
          <polygon
            points="50,5 92,28 92,72 50,95 8,72 8,28"
            stroke={hexColor}
            strokeWidth="10"
            fill="none"
            strokeLinejoin="round"
          />
          </g>
        </g>
        {/* Center circle */}
        <circle cx="50" cy="50" r="9" fill={circleColor} />
      </svg>
      <style>{`
        @keyframes mn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .mn-hide-sm { display: none; }
        }
        /* Improve visibility on ultra-wide screens */
        @media (min-width: 1600px) {
          .mn-logo { transform: scale(1.15); transform-origin: center; }
        }
        @media (min-width: 1920px) {
          .mn-logo { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedLogo;
