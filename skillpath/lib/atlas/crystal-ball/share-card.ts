/**
 * ATLAS 2.0 CAREER CRYSTAL BALL 🔮 — VISUAL CANVAS SHARE CARD GENERATOR
 * Generates high-resolution 1080x1350 magazine-style share card PNG data URLs without external image APIs.
 */

import type { CrystalBallNarrative } from './generator';

export async function generateVisualShareCardDataUrl(narrative: CrystalBallNarrative): Promise<string> {
  if (typeof window === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available.');

  // Background Gradient (Deep Navy to Dark Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(0.5, '#1E293B');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // Gold Accent Top Border Pattern
  const goldGrad = ctx.createLinearGradient(0, 0, 1080, 0);
  goldGrad.addColorStop(0, '#F59E0B');
  goldGrad.addColorStop(0.5, '#FCD34D');
  goldGrad.addColorStop(1, '#D97706');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(80, 80, 920, 8);

  // Header Tag
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('CAREER CRYSTAL BALL 🔮 — TECH CAREER DAILY', 80, 140);

  // Headline Title
  ctx.font = 'bold 52px serif';
  ctx.fillStyle = '#F8FAFC';
  
  // Wrap Headline
  const words = narrative.headline.split(' ');
  let line = '';
  let y = 220;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 900 && n > 0) {
      ctx.fillText(line, 80, y);
      line = words[n] + ' ';
      y += 65;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 80, y);

  // Stats Card Overlay Box
  const boxY = y + 50;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.beginPath();
  ctx.roundRect(80, boxY, 920, 180, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Stats text inside box
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('TARGET ROLE', 120, boxY + 50);
  ctx.fillText('COMPENSATION', 420, boxY + 50);
  ctx.fillText('SKILLS MASTERED', 700, boxY + 50);

  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(narrative.targetRole.slice(0, 18), 120, boxY + 100);
  ctx.fillStyle = '#34D399';
  ctx.fillText(narrative.salary, 420, boxY + 100);
  ctx.fillStyle = '#60A5FA';
  ctx.fillText(`${narrative.learnedSkills.length} Modules`, 700, boxY + 100);

  // Quote Overlay Card
  const quoteY = boxY + 230;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.roundRect(80, quoteY, 920, 240, 16);
  ctx.fill();

  ctx.font = 'italic 30px serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(`"${narrative.pullQuote}"`, 120, quoteY + 80);

  ctx.font = 'normal 24px sans-serif';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText(`— Future Manager, ${narrative.targetCompany}`, 120, quoteY + 160);

  // SkillPath Atlas Branding Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, 1220, 920, 2);

  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('POWERED BY SKILLPATH ATLAS 2.0', 80, 1270);

  ctx.font = 'normal 22px sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Anti-Pedigree • Skill-First Career Intelligence Engine', 550, 1270);

  return canvas.toDataURL('image/png');
}
