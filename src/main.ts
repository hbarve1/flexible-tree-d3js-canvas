import "./style.css";

declare const d3: any;

const PI2 = 2 * Math.PI;
const radius = (r: number) => 1 + Math.sqrt(16 * r);
// const isNaN = (v: number) => Number.isNaN(Number(v));
let lastEvent: any;

class Canvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zoom: any;
  d3canvas: any;

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas") as HTMLCanvasElement;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
    document.body.appendChild(this.canvas);

    let zoom = (this.zoom = d3.behavior
      .zoom()
      .size([width, height])
      .scaleExtent([0.2, 1])
      .on("zoom", () => {
        lastEvent = d3.event;
      }));

    this.d3canvas = d3.select(this.canvas).call(zoom);
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  resize(width: number, height: number) {
    if (this.height == height && this.width == width) return;

    this.canvas.width = +width;
    this.canvas.height = +height;
    this.zoom.size([+width, +height]);
  }
}

class Point {
  x: number;
  y: number;
  color: string;
  radius: number;

  constructor({
    x,
    y,
    color,
    radius,
  }: {
    x: number;
    y: number;
    color: string;
    radius: number;
  }) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
  }
}

class Catalog extends Point {
  name: string;
  bgcolor: string;
  parent: any;
  weight: number;

  constructor({
    x,
    y,
    radius,
    name,
    color,
    bgcolor,
    parent,
  }: {
    x: number;
    y: number;
    radius: number;
    name: string;
    color: string;
    bgcolor: string;
    parent: any;
  }) {
    super({
      x,
      y,
      color,
      radius,
    });
    this.name = name;
    this.bgcolor = bgcolor;
    this.parent = parent;
    this.weight = 1;
  }

  render(ctx: CanvasRenderingContext2D) {
    let r = this.radius;
    ctx.fillStyle = this.bgcolor;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    r = radius(r);
    ctx.arc(this.x, this.y, r, 0, PI2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
}

class Link {
  source: Catalog;
  target: Catalog;
  color: any;
  constructor({
    source,
    target,
    color,
  }: {
    source: Catalog;
    target: Catalog;
    color: any;
  }) {
    this.source = source;
    this.target = target;
    this.color = color;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(255, 255, 255, 0)";
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.source.x, this.source.y);
    ctx.lineTo(this.target.x, this.target.y);
    ctx.closePath();
    ctx.stroke();
  }
}

class Force {
  force;

  constructor(width: number, height: number, nodes: any, links: any) {
    // let collide5, cluster;

    this.force = d3.layout
      .force()
      .charge(function (d: any) {
        var l = radius(d.radius) + radius((d.parent && d.parent.radius) || 0);
        return -l * 20; //100;
      })
      // .friction(.9)
      //.gravity(-.001)
      .linkDistance(60)
      .nodes(nodes)
      .links(links)
      .size([width, height]);
  }

  size(width: number, height: number) {
    this.force.size([width, height]);
    return this;
  }

  get nodes() {
    return this.force.nodes();
  }
  set nodes(value) {
    this.force.nodes(value);
  }

  tick(value: any) {
    if (!arguments.length) return this.force.on("tick");
    this.force.on("tick", value);
    return this;
  }

  start() {
    this.force.start();
    return this;
  }

  stop() {
    this.force.stop();
    return this;
  }
}

let w = window.innerWidth,
  h = window.innerHeight,
  // p = 10,
  max = 60,
  nodes = [
    new Catalog({
      x: w / 2,
      y: h / 2,
      radius: 0,
      color: "hsla(10,80%,75%,.8)",
      bgcolor: "rgba(255, 255, 255, 1)",
    } as any),
  ],
  links: any[] = [];

let force = new Force(w, h, nodes, links).tick(updatePositions).start();

let c = new Canvas(w, h);

d3.timer(function anim() {
  if (w != window.innerWidth || h != window.innerHeight)
    force.size(window.innerWidth, window.innerHeight);

  w = window.innerWidth;
  h = window.innerHeight;

  c.resize(w, h);

  let ctx = c.ctx;

  ctx.save();

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, w, h);

  if (lastEvent) {
    let tr = c.zoom.translate();
    ctx.translate(tr[0], tr[1]);
    let sc = c.zoom.scale();
    ctx.scale(sc, sc);
  }

  // ctx.globalCompositeOperation = 'lighter';
  ctx.globalCompositeOperation = "source-over";

  let l = links.length,
    item;
  while (l--) {
    item = links[l];
    item.render(ctx);
  }

  // ctx.globalCompositeOperation = 'source-over';

  l = nodes.length;
  let maxX = -Infinity,
    minX = Infinity;
  let maxY = -Infinity,
    minY = Infinity;
  while (l--) {
    item = nodes[l];
    maxX = Math.max(maxX, item.x + radius(item.radius));
    minX = Math.min(minX, item.x - radius(item.radius));
    maxY = Math.max(maxY, item.y + radius(item.radius));
    minY = Math.min(minY, item.y - radius(item.radius));
    item.render(ctx);
  }

  let z = c.zoom.scale(),
    tr = c.zoom.translate(),
    zh = z,
    zw = z;

  if (false) {
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.moveTo(minX, nodes[0].y);
    ctx.lineTo(maxX, nodes[0].y);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 5;
    ctx.moveTo(nodes[0].x, minY);
    ctx.lineTo(nodes[0].x, maxY);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.lineWidth = 5;
    ctx.strokeRect(-tr[0] / z + 1, -tr[1] / z + 1, w / z - 1, h / z - 1);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, w * z - 1, h * z - 1);
    ctx.stroke();
    ctx.closePath();
  }

  if (maxX > w || minX < 0) {
    maxX = maxX > w ? maxX : w;
    minX = minX < 0 ? minX : 0;
    zw = w / (2 * Math.max(maxX - nodes[0].x, nodes[0].x - minX));
  }
  if (maxY > h || minY < 0) {
    maxY = maxY > h ? maxY : h;
    minY = minY < 0 ? minY : 0;
    zh = h / (2 * Math.max(maxY - nodes[0].y, nodes[0].y - minY));
  }
  z = d3.min([z, zh, zw]);
  let minZ = c.zoom.scaleExtent()[0];
  z = z < minZ ? minZ : z;

  let w4 = w / 2 - nodes[0].x * z,
    h4 = h / 2 - nodes[0].y * z;

  c.d3canvas.call(c.zoom.scale(z).translate([w4, h4]).event);

  ctx.restore();
});

let t = 0;
d3.timer(function calc() {
  if (t++ % 20) return false;
  let source = nodes[~~(Math.random() * nodes.length)],
    bud = new Catalog({
      x: source.x + Math.random() - 0.5,
      y: source.y + Math.random() - 0.5,
      parent: source,
      radius: ~~(Math.random() * 20),
      color: "hsla(150, 80%, 100%, 1)",
      bgcolor: "rgba(255, 255, 255, 1)",
    } as any);

  inflate(bud);
  links.push(
    new Link({
      source: source,
      target: bud,
      color: "rgba(0, 255, 0, 1)", //'hsla(10,80%,75%,.8)'
    }),
  );
  nodes.push(bud);

  force.start();

  return nodes.length >= max;
});

function inflate(d: any) {
  while ((d = d.parent)) d.weight += 50;
}

function updatePositions() {
  force.force.alpha(0.1); //.resume()
}
