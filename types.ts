export type PlayerRole = 'player1' | 'player2';
export type GameMode = 'online' | 'local';

export type Ball = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
};

export type GameState = {
  ball: Ball;
  paddles: {
    player1: { y: number };
    player2: { y: number };
  };
  scores: {
    player1: number;
    player2: number;
  };
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerRole | null;
  hostId: string | null;
  playerCount: number;
};
