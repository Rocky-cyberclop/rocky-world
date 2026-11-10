import * as Phaser from 'phaser';
import roomData from '../../content/scenes/interview-room.json';
import type { RoomScene } from '../content/types';
import { Player } from '../entities/Player';
import { RoomRenderer } from '../world/RoomRenderer';

/** Landing scene: a 1:1 interview in a manager's office. Visitor = interviewer (walks), Rocky = candidate (seated). */
export class InterviewRoomScene extends Phaser.Scene {
  constructor() {
    super('InterviewRoom');
  }

  create(): void {
    const data = roomData as unknown as RoomScene;
    const room = new RoomRenderer(this, data);
    room.render();

    const spawn = data.player;
    const player = new Player(this, spawn.x, spawn.y, spawn.character, data.characters[spawn.character]);
    player.clampTo(room.floorBounds);
    this.physics.add.collider(player, room.solids);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, room.size.width, room.size.height);
    cam.centerOn(room.size.width / 2, room.size.height / 2);
    cam.fadeIn(400, 0, 0, 0);
  }
}
