import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { FamilyAsystAiStripPlatform } from './platform';
import axios from 'axios';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FamilyAsystAiStripPlatformAccessory {
  private service: Service;
  private state = false;
  constructor(
    private readonly platform: FamilyAsystAiStripPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'FamilyAsyst')
      .setCharacteristic(this.platform.Characteristic.Model, 'AiStrip')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.deviceId);


    this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.handleOnSet.bind(this))
      .onGet(this.handleOnGet.bind(this));
  }

  handleOnGet(): CharacteristicValue {
    this.getOutletState(this.accessory.context.device.deviceId);
    return this.state;
  }

  handleOnSet(value: CharacteristicValue) {
    const state = value === true ? 1 : 0;
    this.controlOutlet(this.accessory.context.device.deviceId, state);
  }

  async getOutletState(deviceId: string) {
    let request, response;

    try {
      request = {
        method: 'GET',
        timeout: 10 * 1000,
        url: this.platform.baseUrl + '/dev/' + deviceId,
        headers: this.platform.apiHeader,
        data: {},
      };

      response = await axios(request);
      if (response === undefined) {
        this.platform.log.error('Failed to get device state. Please check your key');
        return;
      }

      const result = response.data.data.attridVal.split('12_')[1] === '1';
      this.state = result;
      this.service.updateCharacteristic(this.platform.Characteristic.On, result);
    } catch (error) {
      error.status = error.response && error.response.status;
      this.platform.log.error('Failed to get device state. Please check your key');
    }
  }

  async controlOutlet(deviceId, state) {
    let request, response;

    try {
      request = {
        method: 'POST',
        timeout: 10 * 1000,
        url: this.platform.baseUrl + '/dev/' + deviceId + '/control',
        headers: this.platform.apiHeader,
        data: {
          state: state,
          kind: 'ios',
        },
      };

      response = await axios(request);
      if (response === undefined) {
        this.platform.log.error('Failed to control device. Please check your key');
        return;
      }
      const result = response.data.state;
      this.state = result;
      this.service.updateCharacteristic(this.platform.Characteristic.On, result);
    } catch (error) {
      error.status = error.response && error.response.status;
      this.platform.log.error('Failed to control device. Please check your key');
    }
  }
}