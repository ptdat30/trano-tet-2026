import confetti from 'canvas-confetti';

export function fireKpiCelebration(): void {
  // 1. Center fireworks burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#eab308']
  });

  // 2. Left and right cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#fbbf24', '#34d399', '#60a5fa']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#fbbf24', '#34d399', '#60a5fa']
    });
  }, 250);

  // 3. Gold stars shower
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.4 },
      shapes: ['star'],
      colors: ['#FFD700', '#FFA500', '#FFFFFF']
    });
  }, 500);
}
