// Gravitation
const gravity = 1;

const gameCanvas = document.querySelector("#game");
const gameCtx = gameCanvas.getContext("2d");
class Player {
  constructor(startPosition = { x: 100, y: 100 }, spriteType = "mattias") {
    this.speed = 10;
    this.position = { x: startPosition.x, y: startPosition.y };
    this.velocity = { x: 0, y: 0 };
    this.width = 48;
    this.height = 60;
    this.image = new Image();

    // Sprite baserat på spelare
    if (spriteType === "madde") {
      this.image.src = "../images/maddeImage.png";
    } else {
      this.image.src = "../images/mattiasLarge2.png";
    }

    this.id = null;
    this.isRemote = false;
    this.spriteType = spriteType;

    // Animation
    this.frameWidth = 16 * 3;
    this.frameHeight = 20 * 3;
    this.currentFrame = 0;
    this.frameCount = 4;
    this.animationSpeed = 0.2;
    this.frameTimer = 0;

    // Animation rows
    this.animations = {
      runRight: 0,
      runLeft: 1,
      jumpRight: 2,
      jumpLeft: 3,
      idleRight: 4,
      idleLeft: 5,
    };

    this.direction = "idleRight";
    this.lastDirection = "idleRight";
    this.isGrounded = false;

    // Animation smoothing
    this.jumpBuffer = 0;
    this.jumpBufferTime = 0.1;
  }
  update(gameCtx, gameCanvas, gravity, deltaTime, platforms) {
    if (!this.isRemote) {
      const prevVelocityY = this.velocity.y;

      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      // Gravitation
      if (
        this.position.y + this.height + this.velocity.y <=
        gameCanvas.height
      ) {
        this.velocity.y += gravity;
      }

      this.isGrounded =
        this.velocity.y === 0 ||
        this.position.y + this.height >= gameCanvas.height;
    }
  }

  updateGroundedState() {
    this.isGrounded = this.velocity.y === 0;
  }

  updateAnimationState(deltaTime) {
    this.frameTimer += deltaTime;

    if (this.frameTimer >= this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.frameTimer = 0;
    }

    if (this.isRemote) {
      return;
    }

    if (!this.isGrounded) {
      this.jumpBuffer = this.jumpBufferTime;
    } else if (this.jumpBuffer > 0) {
      this.jumpBuffer -= deltaTime;
    }

    const shouldShowJumpAnimation = !this.isGrounded || this.jumpBuffer > 0;

    if (shouldShowJumpAnimation) {
      // Jumping animations
      if (this.velocity.x > 0) {
        this.direction = "jumpRight";
        this.lastDirection = "runRight";
      } else if (this.velocity.x < 0) {
        this.direction = "jumpLeft";
        this.lastDirection = "runLeft";
      } else {
        this.direction =
          this.lastDirection === "runLeft" ? "jumpLeft" : "jumpRight";
      }
    } else if (this.velocity.x > 0) {
      this.direction = "runRight";
      this.lastDirection = "runRight";
    } else if (this.velocity.x < 0) {
      this.direction = "runLeft";
      this.lastDirection = "runLeft";
    } else {
      this.direction =
        this.lastDirection === "runLeft" ? "idleLeft" : "idleRight";
    }
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

  renderAnimated(gameCtx, camera) {
    gameCtx.imageSmoothingEnabled = false;

    const animationRow = this.animations[this.direction];
    const sourceX = this.currentFrame * this.frameWidth;
    const sourceY = animationRow * this.frameHeight;

    gameCtx.drawImage(
      this.image,
      sourceX,
      sourceY,
      this.frameWidth,
      this.frameHeight,
      this.position.x - camera.x,
      this.position.y - camera.y,
      48,
      60,
    );
  }
}

export default Player;
