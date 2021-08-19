import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { FamilyAsystAiStripPlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, FamilyAsystAiStripPlatform);
};
