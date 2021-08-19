import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import axios from 'axios';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { FamilyAsystAiStripPlatformAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class FamilyAsystAiStripPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly baseUrl = 'https://asia-east1.tiscservice.com/api/fa2';
  public apiHeader = {
    'Content-type': 'application/json',
    'Authorization': '',
  };

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    this.apiHeader['Authorization'] = this.config.key;

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  async getDevices() {
    let request, response, result;

    try {
      request = {
        method: 'GET',
        timeout: 10 * 1000,
        url: this.baseUrl + '/dev/all',
        headers: this.apiHeader,
        data: {},
      };

      response = await axios(request);
      if (response === undefined) {
        this.log.error('Failed to get device list. Please check your key');
        return;
      }

      result = response.data;
      if (result.error || result.ok !== true) {
        throw (result);
      }
      const devices : {deviceId: string; deviceName: string}[] = [];
      for (const device of result.data) {
        if (device.deviceType === 'AiStrip') {
          devices.push({
            deviceId: device.outletId,
            deviceName: device.outletName,
          });
        }
      }
      return devices;
    } catch (error) {
      error.status = error.response && error.response.status;
      this.log.error('Failed to get device list. Please check your key');
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.

    const devices = await this.getDevices();
    if (devices === undefined) {
      return;
    }

    // Cleanup removed accessories
    for (const existingAccessory of this.accessories) {
      let accessoryFound = false;
      for (const device of devices) {

        const uuid = this.api.hap.uuid.generate(device.deviceId);
        if (existingAccessory.UUID === uuid) {
          accessoryFound = true;
        }
      }

      if (!accessoryFound) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      }
    }

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.deviceId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new FamilyAsystAiStripPlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        // update accessory cache with any changes to the accessory details and information
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.deviceName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.deviceName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new FamilyAsystAiStripPlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
