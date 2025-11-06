import React, { useState, useEffect } from 'react';
import { socket } from '../services/socketService';
import { PlayerRole } from '../types';

interface LobbyProps {
  onGameStart: (roomId: string, playerRole: PlayerRole) => void;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart, onBack }) => {
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGameStart = ({ roomId, role }: { roomId: string, role: PlayerRole }) => {
        setIsLoading(false);
        setIsWaiting(false);
        onGameStart(roomId, role);
    };

    const handleMatchError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(false);
      setIsWaiting(false);
    };
    
    socket.on('gameStart', handleGameStart);
    socket.on('matchError', handleMatchError);

    return () => {
      socket.off('gameStart', handleGameStart);
      socket.off('matchError', handleMatchError);
    };
  }, [onGameStart]);

  const handleMatchmaking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;
    setIsLoading(true);
    setError(null);
    socket.emit('joinOrCreateRoom', { passphrase: passphrase.toUpperCase() });
    setIsWaiting(true);
  };

  const handleCancel = () => {
    socket.emit('cancelMatchmaking', { passphrase: passphrase.toUpperCase() });
    setIsWaiting(false);
    setIsLoading(false);
  }
  
  if (isWaiting) {
    return (
        <div className="w-full max-w-md p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 text-center">
            <h2 className="text-2xl font-bold mb-4">Finding Match...</h2>
            <p className="text-slate-300 mb-4">Your Passphrase:</p>
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-center text-2xl font-mono tracking-widest mb-6 select-all">
                {passphrase.toUpperCase()}
            </div>
            <p className="animate-pulse text-cyan-400">Waiting for opponent...</p>
            <button
              onClick={handleCancel}
              className="mt-6 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-md p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 text-center relative">
       <button onClick={onBack} className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors">
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Online Matchmaking</h2>
      <p className="text-slate-300 mb-4 text-sm">
        Enter a secret passphrase (あいことば). Your friend must enter the same phrase to start the game.
      </p>

      <form onSubmit={handleMatchmaking} className="mt-6">
        <input
          type="text"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter Passphrase (あいことば)"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
          maxLength={12}
        />
        <button
          type="submit"
          disabled={isLoading || !passphrase}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-500"
        >
          {isLoading ? 'Waiting...' : 'Find Match'}
        </button>
      </form>
      {error && <p className="text-red-400 mt-4">{error}</p>}
       {!socket.connected && <p className="text-yellow-400 mt-4 text-sm">Attempting to connect to server...</p>}
    </div>
  );
};

export default Lobby;