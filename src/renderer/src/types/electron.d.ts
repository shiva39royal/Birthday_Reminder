import { BirthdayBuddyAPI } from '../../main/preload/index';
import { CelebrationAPI } from '../../main/preload/celebration-preload';

declare global {
  interface Window {
    birthdayBuddyAPI: BirthdayBuddyAPI;
    celebrationAPI: CelebrationAPI;
  }
}

