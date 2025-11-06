import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../services/socketService';
import { GameState, PlayerRole, Ball, GameMode } from '../types';
import Celebration from './Celebration';

interface GameScreenProps {
  mode: GameMode;
  roomId?: string;
  playerRole?: PlayerRole;
  onLeave: () => void;
}

// Vertical Layout Constants
const COURT_WIDTH = 300;
const COURT_HEIGHT = 500;
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 10;
const BALL_SIZE = 10;
const WINNING_SCORE = 5;
const AI_SPEED = 2.5; // Difficulty of the AI

const PADDLE_X_INITIAL = (COURT_WIDTH - PADDLE_WIDTH) / 2;

export const INITIAL_BALL_STATE: Ball = {
    x: COURT_WIDTH / 2 - BALL_SIZE / 2,
    y: COURT_HEIGHT / 2 - BALL_SIZE / 2,
    dx: 0,
    dy: 0,
    speed: 4,
};

export const INITIAL_GAME_STATE: GameState = {
  ball: { ...INITIAL_BALL_STATE },
  paddles: {
    player1: { x: PADDLE_X_INITIAL }, // Bottom paddle
    player2: { x: PADDLE_X_INITIAL }, // Top paddle
  },
  scores: {
    player1: 0,
    player2: 0,
  },
  status: 'waiting',
  winner: null,
  hostId: null,
  playerCount: 0,
};

// Function to reset the ball's position and velocity for vertical layout
const resetBall = (ball: Ball) => {
    ball.x = COURT_WIDTH / 2 - BALL_SIZE / 2;
    ball.y = COURT_HEIGHT / 2 - BALL_SIZE / 2;
    ball.speed = 4;
    // Serve up or down to a random direction
    ball.dy = Math.random() > 0.5 ? 1 : -1;
    ball.dx = Math.random() * 2 - 1; // -1 to 1
};


const GameScreen: React.FC<GameScreenProps> = ({ mode, roomId, playerRole, onLeave }) => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  const isHost = playerRole === 'player1';
  const { status, winner } = gameState;
  const amWinner = mode === 'local' ? winner === 'player1' : winner === playerRole;

  // --- LOCAL GAME LOGIC (Vertical) ---
  const runGameLoop = useCallback(() => {
    setGameState(prev => {
        if (prev.status !== 'playing') return prev;

        const newState = JSON.parse(JSON.stringify(prev)) as GameState;
        const { ball, paddles, scores } = newState;

        // Move Ball
        ball.x += ball.dx * ball.speed;
        ball.y += ball.dy * ball.speed;

        // Ball collision with left/right walls
        if (ball.x <= 0 || ball.x >= COURT_WIDTH - BALL_SIZE) {
            ball.dx *= -1;
        }

        // Ball collision with paddles
        const p1 = paddles.player1; // Bottom paddle
        const p2 = paddles.player2; // Top paddle

        // Player 1 (bottom) collision
        if (ball.dy > 0 && ball.y >= COURT_HEIGHT - PADDLE_HEIGHT - BALL_SIZE && ball.x + BALL_SIZE >= p1.x && ball.x <= p1.x + PADDLE_WIDTH) {
            ball.dy = -1; // Go up
            const deltaX = ball.x - (p1.x + PADDLE_WIDTH / 2);
            ball.dx = deltaX * 0.1;
            ball.speed *= 1.05; // Increase speed
        }
        
        // Player 2 (top/AI) collision
        if (ball.dy < 0 && ball.y <= PADDLE_HEIGHT && ball.x + BALL_SIZE >= p2.x && ball.x <= p2.x + PADDLE_WIDTH) {
            ball.dy = 1; // Go down
            const deltaX = ball.x - (p2.x + PADDLE_WIDTH / 2);
            ball.dx = deltaX * 0.1;
            ball.speed *= 1.05; // Increase speed
        }

        // Scoring
        if (ball.y >= COURT_HEIGHT) { // Player 2 (top) scores
            scores.player2++;
            resetBall(ball);
        } else if (ball.y <= -BALL_SIZE) { // Player 1 (bottom) scores
            scores.player1++;
            resetBall(ball);
        }
        
        // AI Movement (Top paddle)
        const p2Center = paddles.player2.x + PADDLE_WIDTH / 2;
        if (p2Center < ball.x - PADDLE_WIDTH / 4) {
             paddles.player2.x += AI_SPEED;
        } else if (p2Center > ball.x + PADDLE_WIDTH / 4) {
             paddles.player2.x -= AI_SPEED;
        }
        paddles.player2.x = Math.max(0, Math.min(paddles.player2.x, COURT_WIDTH - PADDLE_WIDTH));

        // Check for winner
        if (scores.player1 >= WINNING_SCORE) {
            newState.status = 'finished';
            newState.winner = 'player1';
        } else if (scores.player2 >= WINNING_SCORE) {
            newState.status = 'finished';
            newState.winner = 'player2';
        }
        
        return newState;
    });

    gameLoopRef.current = requestAnimationFrame(runGameLoop);
  }, []);

  // Effect for Local Mode
  useEffect(() => {
    if (mode === 'local') {
        setGameState(prev => ({...prev, status: 'playing', playerCount: 2}));
        resetBall(INITIAL_GAME_STATE.ball); // Initial serve
        gameLoopRef.current = requestAnimationFrame(runGameLoop);
    }
    return () => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
        }
    };
  }, [mode, runGameLoop]);
  

  // --- ONLINE GAME LOGIC ---
  useEffect(() => {
    if (mode !== 'online') return;

    const handleGameState = (newState: GameState) => {
      setGameState(newState);
    };

    const handleOpponentDisconnected = () => {
      alert("Your opponent has disconnected.");
      if (!isHost) {
        onLeave();
      }
    };
    
    socket.on('gameState', handleGameState);
    socket.on('opponentDisconnected', handleOpponentDisconnected);

    return () => {
      socket.off('gameState', handleGameState);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
    };
  }, [mode, roomId, onLeave, isHost]);


  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.status !== 'playing' || !gameContainerRef.current) return;

    const rect = gameContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let newX = clientX - rect.left - PADDLE_WIDTH / 2;
    newX = Math.max(0, Math.min(newX, COURT_WIDTH - PADDLE_WIDTH));

    if (mode === 'online') {
        socket.emit('paddleMove', { x: newX });
    } else { // local mode
        setGameState(prev => ({...prev, paddles: {...prev.paddles, player1: { x: newX }}}));
    }
  }, [gameState.status, mode]);

  const handleResetGame = () => {
    if (mode === 'online') {
        if (isHost) socket.emit('resetGame');
    } else { // local mode
        setGameState({...INITIAL_GAME_STATE, status: 'playing', playerCount: 2});
        resetBall(INITIAL_GAME_STATE.ball);
    }
  }

  const handleLeave = () => {
    if (mode === 'online') socket.emit('leaveRoom');
    onLeave();
  }
  
  const renderOverlay = () => {
    const { playerCount } = gameState;
    if (status === 'waiting') {
        return <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-xl">
           <div className="font-bold text-2xl">Room ID: {roomId}</div>
           <div className="mt-4 animate-pulse">Waiting for opponent... ({playerCount}/2)</div>
        </div>
    }
    if (status === 'finished') {
        return <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-xl z-20">
            <div className="font-bold text-4xl mb-4 drop-shadow-lg">{amWinner ? 'You Win!' : 'You Lose!'}</div>
            {(mode === 'local' || isHost) && <button onClick={handleResetGame} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">Play Again</button>}
             <button onClick={handleLeave} className="mt-2 px-4 py-2 bg-red-600 rounded hover:bg-red-700">Leave Game</button>
        </div>
    }
    return null;
  }

  const p1Label = mode === 'local' || playerRole === 'player1' ? 'YOU' : 'P1';
  const p2Label = mode === 'local' ? 'CPU' : (playerRole === 'player2' ? 'YOU' : 'P2');

  return (
    <div className="flex flex-col items-center">
        <div className="flex justify-around w-full max-w-lg mb-2 text-2xl font-bold">
            <span className={p1Label === 'YOU' ? 'text-blue-400' : 'text-slate-300'}>{p1Label}: {gameState.scores.player1}</span>
            <span className={p2Label === 'YOU' ? 'text-red-400' : 'text-slate-300'}>{p2Label}: {gameState.scores.player2}</span>
        </div>
      <div
        ref={gameContainerRef}
        className="relative bg-black border-4 border-slate-600 cursor-none overflow-hidden"
        style={{ width: COURT_WIDTH, height: COURT_HEIGHT }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onTouchStart={e => e.preventDefault()}
      >
        {status === 'finished' && amWinner && <Celebration />}
        {renderOverlay()}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700 opacity-50"></div>
        
        {/* Player 1 Paddle (Bottom) */}
        <div className="absolute bg-blue-400" style={{
          width: PADDLE_WIDTH, height: PADDLE_HEIGHT, top: COURT_HEIGHT - PADDLE_HEIGHT,
          left: gameState.paddles.player1.x
        }}></div>

        {/* Player 2 Paddle (Top) */}
        <div className="absolute bg-red-400" style={{
          width: PADDLE_WIDTH, height: PADDLE_HEIGHT, top: 0,
          left: gameState.paddles.player2.x
        }}></div>

        {gameState.status === 'playing' && <div className="absolute bg-white rounded-full" style={{
          width: BALL_SIZE, height: BALL_SIZE,
          left: gameState.ball.x,
          top: gameState.ball.y
        }}></div>}
      </div>
      <p className="mt-4 text-slate-400">First to {WINNING_SCORE} points wins!</p>
    </div>
  );
};

export default GameScreen;
