import physicalAttackSfx from '../../../assets/sounds/physical_attack.mp3';
import specialAttackSfx from '../../../assets/sounds/special_attack.mp3';
import healSfx from '../../../assets/sounds/heal.mp3';
import blockSfx from '../../../assets/sounds/block.mp3';
import debuffSfx from '../../../assets/sounds/debuff.mp3';
import drawCardSfx from '../../../assets/sounds/draw_card.mp3';
import winBattleSfx from '../../../assets/sounds/win_battle.mp3';
import winFinalSfx from '../../../assets/sounds/win_final.mp3';
import loseFinalSfx from '../../../assets/sounds/lose_final.mp3';

export type SoundEffect =
  | 'physical_attack' | 'special_attack' | 'heal' | 'block'
  | 'debuff' | 'draw_card' | 'win_battle' | 'win_final' | 'lose_final';

const SOUND_URLS: Record<SoundEffect, string> = {
  physical_attack: physicalAttackSfx,
  special_attack: specialAttackSfx,
  heal: healSfx,
  block: blockSfx,
  debuff: debuffSfx,
  draw_card: drawCardSfx,
  win_battle: winBattleSfx,
  win_final: winFinalSfx,
  lose_final: loseFinalSfx,
};

/** Play a sound effect. Creates a new Audio instance each call so
 *  overlapping sounds from multi-effect cards don't cut each other off.
 *  Cleans up the Audio element after playback to prevent accumulation. */
export function playSound(sound: SoundEffect): void {
  const audio = new Audio(SOUND_URLS[sound]);
  audio.addEventListener('ended', () => {
    audio.remove();
    audio.src = '';
  });
  audio.play().catch(() => {}); // Gracefully handle autoplay restrictions
}
