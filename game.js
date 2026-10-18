// Code-Cursor Snake Game
// Plain Vanilla JavaScript - Zero Frameworks

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  
  const scoreEl = document.getElementById('score');
  const finalScoreEl = document.getElementById('final-score');
  const overlay = document.getElementById('game-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalIcon = document.getElementById('modal-icon');
  const restartBtn = document.getElementById('restart-btn');

  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');

  // Constants
  const GRID_SIZE = 20; // 20x20 grid
  const CELL_SIZE = canvas.width / GRID_SIZE; // 20px per cell
  const INITIAL_SPEED = 220; // ms per move
  const SPEED_DECREMENT = 6; // ms faster per bug
  const MIN_SPEED = 90; // max velocity limit

  // Game State
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let directionQueue = [];
  let food = { x: 15, y: 10 };
  let score = 0;
  let isRunning = false;
  let isGameOver = false;
  let moveInterval = INITIAL_SPEED;
  let lastMoveTime = 0;
  let particles = [];

  // Initialize Game
  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    directionQueue = [];
    score = 0;
    scoreEl.textContent = '0';
    moveInterval = INITIAL_SPEED;
    particles = [];
    isGameOver = false;
    isRunning = true;
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    spawnFood();
    lastMoveTime = performance.now();
  }

  // Spawn food at a free random cell
  function spawnFood() {
    const emptyCells = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isOccupied = snake.some(segment => segment.x === x && segment.y === y);
        if (!isOccupied) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      triggerGameOver(true); // You Win! Filled entire grid
      return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    food = emptyCells[randomIndex];
  }

  // Spawn particle burst when bug is eaten
  function spawnParticleBurst(gridX, gridY) {
    const centerX = gridX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = gridY * CELL_SIZE + CELL_SIZE / 2;
    const count = 16;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.025
      });
    }
  }

  // Trigger game over or victory
  function triggerGameOver(isWin) {
    isRunning = false;
    isGameOver = true;

    // Trigger short screen shake on game over
    canvasWrapper.classList.remove('shake');
    // Force DOM reflow to restart animation reliably
    void canvasWrapper.offsetWidth;
    canvasWrapper.classList.add('shake');
    setTimeout(() => {
      canvasWrapper.classList.remove('shake');
    }, 400);

    finalScoreEl.textContent = score;

    if (isWin) {
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'Victory!';
      modalMessage.textContent = 'You caught all the bugs and cleared the grid!';
    } else {
      modalIcon.textContent = '💥';
      modalTitle.textContent = 'Game Over';
      modalMessage.textContent = 'You collided with your own trail!';
    }

    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
  }

  // Update Game Logic Step
  function updateGame() {
    if (directionQueue.length > 0) {
      nextDirection = directionQueue.shift();
    }
    direction = nextDirection;

    // Toroidal wrap around walls
    const newHead = {
      x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
      y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE
    };

    // Check collision with self
    // Check against segments (if moving into space where tail is about to leave, that's safe only if not eating food)
    const willEat = (newHead.x === food.x && newHead.y === food.y);
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);

    const hitSelf = bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y);
    if (hitSelf) {
      triggerGameOver(false);
      return;
    }

    // Move snake
    snake.unshift(newHead);

    if (willEat) {
      score++;
      scoreEl.textContent = score;
      spawnParticleBurst(food.x, food.y);
      // Speed calculation: start 220ms, -6ms per bug, minimum 90ms
      moveInterval = Math.max(MIN_SPEED, INITIAL_SPEED - (score * SPEED_DECREMENT));
      spawnFood();
    } else {
      snake.pop();
    }
  }

  // Helper to draw rounded rectangle
  function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    if (typeof context.roundRect === 'function') {
      context.roundRect(x, y, width, height, radius);
    } else {
      const r = Math.min(radius, width / 2, height / 2);
      context.moveTo(x + r, y);
      context.arcTo(x + width, y, x + width, y + height, r);
      context.arcTo(x + width, y + height, x, y + height, r);
      context.arcTo(x, y + height, x, y, r);
      context.arcTo(x, y, x + width, y, r);
      context.closePath();
    }
    context.fill();
  }

  // Render Game Scene
  function render(time) {
    // 1. Clear canvas with deep dark shade (#000000) so it visibly contrasts against page (#0a0e17)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Faint Grid with crisp, thin lines (subtle blueprint grid)
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Draw Food: Larger bug emoji with soft pulsing ambient glow
    const pulse = 1 + 0.12 * Math.sin(time / 160);
    const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.save();
    ctx.translate(foodCenterX, foodCenterY);

    // Soft ambient pulsing radial glow
    const glowRadius = CELL_SIZE * 1.35;
    const glowAlpha = 0.32 + 0.16 * Math.sin(time / 160);
    const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, glowRadius);
    glowGrad.addColorStop(0, `rgba(56, 189, 248, ${glowAlpha})`);
    glowGrad.addColorStop(0.45, `rgba(56, 189, 248, ${glowAlpha * 0.45})`);
    glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Larger bug emoji with electric-blue drop shadow
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12 + 6 * Math.sin(time / 160);
    ctx.font = `${CELL_SIZE + 6}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐛', 0, 1);
    ctx.restore();

    // 4. Draw Snake: Clearly rounded segments, glowing code-cursor with fading trail
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const px = seg.x * CELL_SIZE;
      const py = seg.y * CELL_SIZE;

      ctx.save();
      if (i === 0) {
        // Snake Head: Rounded Glowing Code Cursor Block
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#38bdf8';
        drawRoundedRect(ctx, px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 7);

        // Code cursor inner contrast slit (rounded)
        ctx.fillStyle = '#f8fafc';
        drawRoundedRect(ctx, px + 5, py + 5, CELL_SIZE - 10, CELL_SIZE - 10, 3.5);
      } else {
        // Snake Body: Rounded segments with smooth fading trail
        const progress = i / snake.length;
        const alpha = Math.max(0.18, 0.9 * (1 - progress));
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = Math.max(0, 8 * (1 - progress));
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        
        const inset = 2.5;
        const segRadius = Math.max(4, 6.5 * (1 - progress * 0.2));
        drawRoundedRect(ctx, px + inset, py + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2, segRadius);
      }
      ctx.restore();
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  // Main Loop
  function gameLoop(currentTime) {
    if (isRunning) {
      if (currentTime - lastMoveTime >= moveInterval) {
        updateGame();
        lastMoveTime = currentTime;
      }
    }

    render(currentTime);
    requestAnimationFrame(gameLoop);
  }

  // Direction Change Handler (Prevents 180-degree immediate reversal)
  function setDirection(x, y) {
    if (!isRunning) return;

    const lastPlannedDir = directionQueue.length > 0 
      ? directionQueue[directionQueue.length - 1] 
      : direction;

    // Check opposite direction
    if (x !== 0 && x === -lastPlannedDir.x) return;
    if (y !== 0 && y === -lastPlannedDir.y) return;

    // Avoid queueing identical redundant inputs
    if (x === lastPlannedDir.x && y === lastPlannedDir.y) return;

    if (directionQueue.length < 2) {
      directionQueue.push({ x, y });
    }
  }

  // Keyboard Controls (Desktop)
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setDirection(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setDirection(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setDirection(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setDirection(1, 0);
        e.preventDefault();
        break;
      case ' ':
      case 'Enter':
        if (isGameOver) {
          initGame();
          e.preventDefault();
        }
        break;
    }
  });

  // Touch / Button Controls (Mobile & D-Pad)
  function attachTouchButton(buttonEl, dirX, dirY) {
    const handlePress = (e) => {
      e.preventDefault();
      setDirection(dirX, dirY);
      buttonEl.classList.add('is-pressed');
    };

    const handleRelease = (e) => {
      buttonEl.classList.remove('is-pressed');
    };

    buttonEl.addEventListener('pointerdown', handlePress);
    buttonEl.addEventListener('pointerup', handleRelease);
    buttonEl.addEventListener('pointerleave', handleRelease);
    buttonEl.addEventListener('pointercancel', handleRelease);
  }

  attachTouchButton(btnUp, 0, -1);
  attachTouchButton(btnDown, 0, 1);
  attachTouchButton(btnLeft, -1, 0);
  attachTouchButton(btnRight, 1, 0);

  // Restart Button
  restartBtn.addEventListener('click', () => {
    initGame();
  });

  restartBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    initGame();
  });

  // Start initial game
  initGame();
  requestAnimationFrame(gameLoop);
});
