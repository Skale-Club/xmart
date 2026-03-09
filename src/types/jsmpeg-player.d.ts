declare module 'jsmpeg-player' {
  interface PlayerOptions {
    canvas?: HTMLCanvasElement;
    autoplay?: boolean;
    audio?: boolean;
    videoBufferSize?: number;
    onPlay?: () => void;
    onStalled?: () => void;
  }

  class Player {
    constructor(url: string, options?: PlayerOptions);
    destroy(): void;
  }

  const JSMpeg: {
    Player: typeof Player;
  };

  export default JSMpeg;
}
