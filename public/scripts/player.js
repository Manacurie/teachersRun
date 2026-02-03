// Gravitation
const gravity = 1;

const gameCanvas = document.querySelector("#game");
const gameCtx = gameCanvas.getContext("2d");
class Player {
  constructor(startPosition = { x: 100, y: 100 }) {
    this.speed = 10;
    this.position = { x: startPosition.x, y: startPosition.y };
    this.velocity = { x: 0, y: 0 };
    this.width = 64;
    this.height = 120;
    this.image = new Image();
    this.image.src = "../images/mattiasImage.png";
    this.id = null; // Will be set by multiplayer system
    this.isRemote = false; // Track if this is a remote player
  }
  update(gameCtx, gameCanvas, gravity, deltaTime, platforms) {
    // Only apply physics and movement to local players
    if (!this.isRemote) {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      // gravitation
      if (this.position.y + this.height + this.velocity.y <= gameCanvas.height) {
        this.velocity.y += gravity;
      }
    }
    
    // Render the player
    this.render(gameCtx);
  }

  render(gameCtx) {
    gameCtx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
  }
}

export default Player;
