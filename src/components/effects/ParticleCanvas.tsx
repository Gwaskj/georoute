"use client";

import { useEffect, useRef } from "react";
import { Effect } from "@/lib/theme-types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  rotation?: number;
  vr?: number;
  life?: number;
  maxLife?: number;
}

interface Props {
  effect: Effect;
  intensity: number;
  color: string;
}

export default function ParticleCanvas({ effect, intensity, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (effect === "none") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = Math.round((intensity / 100) * getMaxParticles(effect));

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Initialise particle pool
    particlesRef.current = Array.from({ length: count }, () =>
      makeParticle(effect, color, canvas!.width, canvas!.height)
    );

    function tick() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        updateParticle(p, effect, canvas.width, canvas.height, color);
        drawParticle(ctx, p, effect);
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
    };
  }, [effect, intensity, color]);

  if (effect === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}

function getMaxParticles(effect: Effect): number {
  switch (effect) {
    case "snow": return 150;
    case "rain": return 200;
    case "confetti": return 120;
    case "fireflies": return 40;
    case "stars": return 80;
    case "hearts": return 50;
    case "leaves": return 60;
    default: return 60;
  }
}

function makeParticle(
  effect: Effect,
  color: string,
  w: number,
  h: number
): Particle {
  switch (effect) {
    case "snow":
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: Math.random() * 1.5 + 0.5,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.4,
        color,
      };
    case "rain":
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: -0.5,
        vy: Math.random() * 8 + 10,
        radius: Math.random() * 0.8 + 0.4,
        opacity: Math.random() * 0.4 + 0.3,
        color,
      };
    case "confetti": {
      const hue = Math.random() * 360;
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
        radius: Math.random() * 5 + 3,
        opacity: 1,
        color: `hsl(${hue},80%,60%)`,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      };
    }
    case "fireflies":
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
        opacity: 0,
        color,
        life: Math.random() * Math.PI * 2,
        maxLife: Math.PI * 2,
      };
    case "stars":
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        color,
        life: Math.random() * Math.PI * 2,
        maxLife: Math.PI * 2,
      };
    case "hearts":
      return {
        x: Math.random() * w,
        y: Math.random() * h + h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 1.5 + 0.5),
        radius: Math.random() * 8 + 4,
        opacity: Math.random() * 0.5 + 0.3,
        color,
      };
    case "leaves": {
      const hue = 100 + Math.random() * 60;
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 1.5 + 0.5,
        radius: Math.random() * 7 + 4,
        opacity: Math.random() * 0.6 + 0.4,
        color: `hsl(${hue},60%,50%)`,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.05,
      };
    }
    default:
      return { x: 0, y: 0, vx: 0, vy: 0, radius: 2, opacity: 0.5, color };
  }
}

function updateParticle(
  p: Particle,
  effect: Effect,
  w: number,
  h: number,
  color: string
) {
  switch (effect) {
    case "snow":
      p.x += p.vx + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.3;
      p.y += p.vy;
      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      break;
    case "rain":
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) {
        p.y = -20;
        p.x = Math.random() * w;
      }
      break;
    case "confetti":
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      if (p.rotation !== undefined && p.vr !== undefined) p.rotation += p.vr;
      if (p.y > h + 20) {
        p.y = -10;
        p.x = Math.random() * w;
        p.vy = Math.random() * 2 + 1;
      }
      break;
    case "fireflies":
      p.x += p.vx + Math.sin(Date.now() * 0.0005 + p.y) * 0.3;
      p.y += p.vy + Math.cos(Date.now() * 0.0005 + p.x) * 0.3;
      if (p.life !== undefined) {
        p.life += 0.04;
        p.opacity = (Math.sin(p.life) + 1) * 0.5;
      }
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
      }
      break;
    case "stars":
      if (p.life !== undefined) {
        p.life += 0.02;
        p.opacity = ((Math.sin(p.life) + 1) / 2) * 0.7 + 0.1;
      }
      break;
    case "hearts":
      p.x += p.vx + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.3;
      p.y += p.vy;
      p.opacity -= 0.003;
      if (p.y < -20 || p.opacity <= 0) {
        p.y = h + 20;
        p.x = Math.random() * w;
        p.opacity = Math.random() * 0.5 + 0.3;
        p.vy = -(Math.random() * 1.5 + 0.5);
      }
      break;
    case "leaves":
      p.x += p.vx + Math.sin(Date.now() * 0.001 + p.y * 0.02) * 0.5;
      p.y += p.vy;
      if (p.rotation !== undefined && p.vr !== undefined) p.rotation += p.vr;
      if (p.y > h + 20) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      break;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, effect: Effect) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));

  switch (effect) {
    case "snow":
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fill();
      break;

    case "rain": {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 1, p.y - 12);
      ctx.stroke();
      break;
    }

    case "confetti":
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius * 1.6);
      break;

    case "fireflies":
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      break;

    case "stars":
      drawStar(ctx, p.x, p.y, p.radius * 2, p.color);
      break;

    case "hearts":
      drawHeart(ctx, p.x, p.y, p.radius, p.color);
      break;

    case "leaves":
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius * 0.5, p.radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      break;
  }

  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    if (i === 0) ctx.moveTo(x + r * Math.cos(outer), y + r * Math.sin(outer));
    else ctx.lineTo(x + r * Math.cos(outer), y + r * Math.sin(outer));
    ctx.lineTo(x + (r / 2) * Math.cos(inner), y + (r / 2) * Math.sin(inner));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.3);
  ctx.bezierCurveTo(x - r, y - r * 0.5, x - r * 1.5, y + r * 0.5, x, y + r * 1.2);
  ctx.bezierCurveTo(x + r * 1.5, y + r * 0.5, x + r, y - r * 0.5, x, y + r * 0.3);
  ctx.fill();
  ctx.restore();
}
