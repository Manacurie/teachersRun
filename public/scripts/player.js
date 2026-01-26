
class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.width = 50;
    this.height = 50;
    this.color = "blue";
  }
  render(ctx) {
    ctx.fillRect = (this.position.x, this.position.y, this.width, this.height);
  }
}

const player = new Player();

export default player;