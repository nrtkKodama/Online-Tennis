import React, { useState, useEffect } from 'react';
import { socket } from '../services/socketService';
import { PlayerRole } from '../types';

interface LobbyProps {
  onGameStart: (roomId: string, playerRole: PlayerRole) => void;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart, onBack }) => {
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);


  useEffect(() => {
    // Listener for when the server confirms room creation
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setCreatedRoomId(roomId);
      // Don't auto-start, wait for player 2
    };

    // Listener for when the server confirms joining a room
    const handleGameStart = ({ roomId, role }: { roomId: string, role: PlayerRole }) => {
        setIsLoading(false);
        onGameStart(roomId, role);
    };

    // Listener for any errors from the server (e.g., room full, not found)
    const handleJoinError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(false);
    };
    
    socket.on('roomCreated', handleRoomCreated);
    socket.on('gameStart', handleGameStart);
    socket.on('joinError', handleJoinError);

    // Clean up listeners on component unmount
    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('gameStart', handleGameStart);
      socket.off('joinError', handleJoinError);
    };
  }, [onGameStart]);

  const handleCreateRoom = () => {
    setIsLoading(true);
    setError(null);
    socket.emit('createRoom');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    socket.emit('joinRoom', { roomId: roomId.toUpperCase() });
  };
  
  if (createdRoomId) {
    return (
        <div className="w-full max-w-md p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 text-center">
            <h2 className="text-2xl font-bold mb-4">Room Created!</h2>
            <p className="text-slate-300 mb-4">Share this ID with your friend:</p>
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-center text-2xl font-mono tracking-widest mb-6 select-all">
                {createdRoomId}
            </div>
            <p className="animate-pulse text-cyan-400">Waiting for opponent to join...</p>
        </div>
    )
  }

  return (
    <div className="w-full max-w-md p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 text-center">
       <button onClick={onBack} className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors">
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold mb-6">Join or Create a Game</h2>
      
      <button
        onClick={handleCreateRoom}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-500"
      >
        {isLoading ? 'Creating...' : 'Create New Room'}
      </button>

      <div className="my-6 flex items-center">
        <hr className="flex-grow border-t border-slate-600" />
        <span className="px-4 text-slate-400">OR</span>
        <hr className="flex-grow border-t border-slate-600" />
      </div>

      <form onSubmit={handleJoinRoom}>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter Room ID"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
          maxLength={5}
        />
        <button
          type="submit"
          disabled={isLoading || !roomId}
          className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-500"
        >
          {isLoading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
      {error && <p className="text-red-400 mt-4">{error}</p>}
       {!socket.connected && <p className="text-yellow-400 mt-4 text-sm">Attempting to connect to server... Make sure the backend is running.</p>}
    </div>
  );
};

export default Lobby;
