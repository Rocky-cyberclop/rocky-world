import * as Phaser from 'phaser';
import bookshelfCard from '../../content/cards/bookshelf.json';
import doorCard from '../../content/cards/door.json';
import fireplaceCard from '../../content/cards/fireplace.json';
import globeCard from '../../content/cards/globe.json';
import worldMapCard from '../../content/cards/world-map.json';
import introData from '../../content/cutscenes/intro.json';
import rockyDialog from '../../content/dialogs/rocky.json';
import roomData from '../../content/scenes/interview-room.json';
import type { Interaction, RoomScene } from '../content/types';
import { IntroCutscene, type IntroData } from '../cutscenes/IntroCutscene';
import { DialogRunner, type DialogData } from '../dialog/DialogRunner';
import { Player } from '../entities/Player';
import { OPEN_CV_EVENT } from '../ui/CvButton';
import { openCvViewer } from '../ui/CvViewer';
import { openInfoCard, type CardData } from '../ui/InfoCard';
import { Interactables } from '../world/Interactables';
import { RoomRenderer } from '../world/RoomRenderer';

/** Dialogs by name, used by "dialog:<name>" actions. */
const DIALOGS: Record<string, DialogData> = { rocky: rockyDialog as DialogData };

/** Info cards by name, used by "card:<name>" actions (content/cards/<name>.json). */
const CARDS: Record<string, CardData> = {
  bookshelf: bookshelfCard as CardData,
  'world-map': worldMapCard as CardData,
  globe: globeCard as CardData,
  fireplace: fireplaceCard as CardData,
  door: doorCard as CardData,
};

/** Landing scene: a 1:1 interview in a manager's office. Visitor = interviewer (walks), Rocky = candidate (seated). */
export class InterviewRoomScene extends Phaser.Scene {
  private room!: RoomRenderer;
  private player!: Player;
  private intro!: IntroCutscene;
  /** true while a dialog / viewer is open: no walking, no prompts */
  private busy = false;
  /** the player gets control only after the intro */
  private introDone = false;

  constructor() {
    super('InterviewRoom');
  }

  create(): void {
    const data = roomData as unknown as RoomScene;
    this.busy = false;
    this.introDone = false;
    const room = new RoomRenderer(this, data);
    room.render();
    this.room = room;

    const spawn = data.player;
    const player = new Player(this, spawn.x, spawn.y, spawn.character, data.characters[spawn.character]);
    player.clampTo(room.floorBounds);
    this.physics.add.collider(player, room.solids);
    this.player = player;

    const cam = this.cameras.main;
    cam.setBounds(0, 0, room.size.width, room.size.height);
    cam.centerOn(room.size.width / 2, room.size.height / 2);

    new Interactables(
      this,
      data.interactions ?? [],
      () => {
        const b = player.body as Phaser.Physics.Arcade.Body;
        return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
      },
      () => player.controlsEnabled && !this.busy,
      (zone) => void this.interact(zone),
    );

    // top-right CV button: opens the viewer unless a dialog is already open
    const onCvButton = () => void this.run('cv');
    this.game.events.on(OPEN_CV_EVENT, onCvButton);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(OPEN_CV_EVENT, onCvButton));

    // intro cutscene, then hand over control
    player.controlsEnabled = false;
    this.intro = new IntroCutscene(this, room, [player], introData as IntroData);
    void this.intro.play().then(() => {
      this.introDone = true;
      if (!this.busy) player.controlsEnabled = true;
    });
  }

  private interact(zone: Interaction): Promise<void> {
    this.intro.dismiss();
    return this.run(zone.action);
  }

  /** Run an action with the player frozen; afterwards control goes back to how it was (still off during the intro). */
  private async run(action: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.player.controlsEnabled = false;
    try {
      await this.runAction(action);
    } finally {
      this.busy = false;
      this.player.controlsEnabled = this.introDone;
    }
  }

  private async runAction(action: string): Promise<void> {
    if (action.startsWith('dialog:')) {
      const dialog = DIALOGS[action.slice('dialog:'.length)];
      const speaker = dialog && this.room.characters.get(dialog.speaker);
      if (!dialog || !speaker) return console.warn(`[Room] Unknown dialog "${action}"`);
      const next = await new DialogRunner(this, speaker, dialog).run();
      if (next) await this.runAction(next);
    } else if (action.startsWith('card:')) {
      const card = CARDS[action.slice('card:'.length)];
      if (!card) return console.warn(`[Room] Unknown card "${action}"`);
      await openInfoCard(card);
    } else if (action === 'cv') {
      await openCvViewer();
    } else {
      console.warn(`[Room] Unknown action "${action}"`);
    }
  }
}
