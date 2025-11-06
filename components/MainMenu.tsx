import React from 'react';
import { GameMode } from '../types';

interface MainMenuProps {
    onSelectMode: (mode: GameMode) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode }) => {
    return (
        <div className="w-full max-w-sm p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 text-center flex flex-col gap-6">
            <h2 className="text-2xl font-bold mb-2">Choose Game Mode</h2>
            <button
                onClick={() => onSelectMode('online')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            >
                🌎 Play Online
            </button>
            <button
                onClick={() => onSelectMode('local')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
            >
                🤖 Play vs Computer
            </button>
        </div>
    );
};

export default MainMenu;
