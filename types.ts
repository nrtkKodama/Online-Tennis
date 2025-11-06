// Fix: Removed circular self-import and defined types directly.
export type PlayerRole = 'player1' | 'player2';

export type GameMode = 'local' | 'online';

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
    player1: { x: number };
    player2: { x: number };
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
