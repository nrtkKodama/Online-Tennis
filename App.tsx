import React, { useState } from 'react';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import MainMenu from './components/MainMenu';
import { PlayerRole, GameMode } from './types';

type Screen = 'menu' | 'lobby' | 'game';

interface GameConfig {
  mode: GameMode;
  roomId?: string;
  playerRole?: PlayerRole;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  
  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'local') {
      setGameConfig({ mode: 'local', playerRole: 'player1' });
      setScreen('game');
    } else {
      setScreen('lobby');
    }
  };

  const handleGameStart = (roomId: string, playerRole: PlayerRole) => {
    setGameConfig({ mode: 'online', roomId, playerRole });
    setScreen('game');
  };

  const handleLeaveGame = () => {
    setGameConfig(null);
    setScreen('menu');
  };

  const renderScreen = () => {
    switch(screen) {
      case 'menu':
        return <MainMenu onSelectMode={handleSelectMode} />;
      case 'lobby':
        return <Lobby onGameStart={handleGameStart} onBack={() => setScreen('menu')} />;
      case 'game':
        if (gameConfig) {
          return <GameScreen {...gameConfig} onLeave={handleLeaveGame} />;
        }
        // Fallback to menu if config is missing
        handleLeaveGame();
        return null; 
      default:
        return <MainMenu onSelectMode={handleSelectMode} />;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-slate-800 font-sans p-4 sm:p-6 lg:p-8">
       <header className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Online Tennis
        </h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center">
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;
