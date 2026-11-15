import { uiRoot } from './overlay';

/** Joystick direction: x and y are -1, 0 or 1 (8 directions, like the arrow keys). Read by Player. */
export const stick = { x: 0, y: 0 };

/** Fired by the "A" button; Interactables runs the current zone (same as pressing E). */
export const INTERACT_EVENT = 'ui:interact';

/** 8 directions, starting at "right" and going clockwise (screen y points down). */
const DIRS: [number, number][] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

/**
 * On-screen controls for phones / tablets: a joystick (bottom-left) and an "A" button (bottom-right).
 * Only visible in touch mode (`body.touch`, see style.css). Returns a function that removes them.
 */
export function mountTouchControls(): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'touch-controls';

  // ---------- joystick ----------
  const base = document.createElement('div');
  base.className = 'joystick';
  base.setAttribute('aria-hidden', 'true'); // keyboard users have WASD
  const knob = document.createElement('div');
  knob.className = 'joystick-knob';
  base.append(knob);

  let pointerId: number | undefined;
  const move = (e: PointerEvent) => {
    const r = base.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = e.clientX - (r.left + radius);
    let dy = e.clientY - (r.top + radius);
    const dist = Math.hypot(dx, dy);
    const max = radius * 0.6; // how far the knob can travel
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    if (dist < radius * 0.22) {
      stick.x = stick.y = 0; // dead zone in the middle
    } else {
      const octant = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      [stick.x, stick.y] = DIRS[octant];
    }
  };
  const release = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = undefined;
    stick.x = stick.y = 0;
    knob.style.transform = '';
    base.classList.remove('active');
  };
  base.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pointerId = e.pointerId;
    base.setPointerCapture(e.pointerId);
    base.classList.add('active');
    move(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (e.pointerId === pointerId) move(e);
  });
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);
  base.addEventListener('lostpointercapture', release);

  // ---------- A button ----------
  const a = document.createElement('button');
  a.type = 'button';
  a.className = 'touch-a';
  a.textContent = 'A';
  a.setAttribute('aria-label', 'Interact');
  a.addEventListener('pointerdown', (e) => e.preventDefault()); // no focus ring / double-tap zoom
  a.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new Event(INTERACT_EVENT));
  });

  wrap.append(base, a);
  uiRoot().append(wrap);

  return () => {
    stick.x = stick.y = 0;
    wrap.remove();
  };
}
