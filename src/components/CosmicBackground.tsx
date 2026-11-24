import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star palette
    const colors = ['#ffffff', '#e0f2fe', '#fef08a', '#c084fc', '#67e8f9'];

    // Generate stars
    const starCount = Math.min(130, Math.floor((width * height) / 8000));
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    // Shooting stars state
    const shootingStars: ShootingStar[] = [];
    const spawnShootingStar = () => {
      if (shootingStars.length < 2 && Math.random() < 0.3) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 8 + 6,
          angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1), // ~45 degrees
          opacity: 1,
          active: true
        });
      }
    };

    // Spawn shooting stars periodically
    const shootInterval = setInterval(spawnShootingStar, 4000);

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Main animation loop
    const render = (time: number) => {
      // Pause if tab is hidden to save battery
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw twinkling stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        // Twinkle
        star.alpha += Math.sin(time * star.twinkleSpeed) * 0.015;
        const currentAlpha = Math.max(0.1, Math.min(1, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        // Subtle glow for larger stars
        if (star.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = currentAlpha * 0.25;
          ctx.fill();
        }
      }

      // 2. Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const headX = s.x;
        const headY = s.y;
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.3, `rgba(125, 211, 252, ${s.opacity * 0.6})`);
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Move shooting star
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.012;

        if (s.opacity <= 0 || s.x > width + 100 || s.y > height + 100) {
          s.active = false;
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(shootInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Deep space base color */}
      <div className="absolute inset-0 bg-[#05070f]" />

      {/* 2. Floating colorful cosmic nebulas (pure CSS blur for depth) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-950/40 blur-[100px] animate-pulse" />
      <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-purple-950/30 blur-[90px]" />
      <div className="absolute bottom-1/3 left-1/4 w-[28rem] h-[28rem] rounded-full bg-emerald-950/25 blur-[120px]" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-sky-950/35 blur-[110px]" />

      {/* 3. High performance dynamic star canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
