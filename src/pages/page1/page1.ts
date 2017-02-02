import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { DomoticzService, DomoticzSettingsModel } from './../../providers/domoticz.provider';

const defaultSettings = {
  server: '192.168.178.33',
  protocol: 'http://',
  port: '8080',
  refreshdelay: 50000
};

@Component({
  selector: 'page-page1',
  templateUrl: 'page1.html'
})
export class Page1 {

  deviceList: Array<string> = [];
  deviceData: Object = {};
  //  idxList: Array<number> = [];

  deviceSubscription: any;
  settings: DomoticzSettingsModel = defaultSettings;

  constructor(
    public navCtrl: NavController,
    public domoticzService: DomoticzService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    //this.domoticzService.initDomoticzService(this.settings); // to avoid issues when going to Page2 without startObserving
  }

  startObserving() {
    this.domoticzService.initDomoticzService(this.settings);

    // set the initial list
    this.deviceList = [];

    // if we already observed stuff, then undo the subscription
    if (this.deviceSubscription !== undefined) {
      this.deviceSubscription.unsubscribe();
      // console.log('unsub');
    }

    // and start observing again
    this.deviceSubscription = this.domoticzService.getDomoticzDeviceObservable()
      .subscribe(
      value => {

        // if the device is already found, then don't add it
        if (typeof value['error'] === 'undefined')
        { if (this.deviceList.indexOf(value['idx']) == -1) this.deviceList.push(value['idx']); }
        // if an error is received, we kill the watcher and need to do something smart
        else {
          console.log('Error received', value);
          this.domoticzService.doneDomoticzService();
          this.deviceSubscription.unsubscribe();

          this.doToast('There was an issue accessing the Domoticz server');
        }

        // and replace the data
        this.deviceData[value['idx']] = value;
      },

      error => console.log(error));
  }

  /**
   * Do a toast message.
   * 
   * @param {string} message - The message to be toasted.
   */
  doToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'middle'
    });

    toast.onDidDismiss(() => {
//      console.log('Dismissed toast');
    });

    toast.present();
  }

}
