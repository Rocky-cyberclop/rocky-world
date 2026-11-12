import * as Phaser from 'phaser';
import roomData from '../content/scenes/interview-room.json';
import { BG_COLOR, TILE } from './config';
import { BootScene } from './scenes/BootScene';
import { InterviewRoomScene } from './scenes/InterviewRoomScene';
import { StartScene } from './scenes/StartScene';
import './style.css';

document.documentElement.style.setProperty('--bg', BG_COLOR);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: BG_COLOR,
  pixelArt: true, // crisp pixels, no smoothing
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // native size = the room's size from its data file; scaled up to fit the window
    width: roomData.room.tilesWide * TILE,
    height: roomData.room.tilesHigh * TILE,
  },
  physics: {
    default: 'arcade',
    // open http://localhost:5173/?debug to see collision boxes
    arcade: { debug: new URLSearchParams(location.search).has('debug') },
  },
  scene: [BootScene, StartScene, InterviewRoomScene],
});
