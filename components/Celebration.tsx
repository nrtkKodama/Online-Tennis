import React from 'react';

const Celebration: React.FC = () => {
    const confettiCount = 100;
    const confetti = Array.from({ length: confettiCount }).map((_, i) => {
        const style = {
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 5}px`,
            height: `${Math.random() * 8 + 5}px`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 60%)`,
            animationDuration: `${Math.random() * 2 + 3}s`,
            animationDelay: `${Math.random() * 2}s`,
        };
        return <div key={i} className="confetti" style={style}></div>;
    });

    return (
        <>
            <style>
                {`
                .celebration-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 10;
                }
                .confetti {
                    position: absolute;
                    top: -20px;
                    animation: fall linear forwards;
                }
                @keyframes fall {
                    to {
                        transform: translateY(110vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                `}
            </style>
            <div className="celebration-container">{confetti}</div>
        </>
    );
};

export default Celebration;
