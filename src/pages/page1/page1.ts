import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { SONOSService } from './../../providers/sonos.provider';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-page1',
  templateUrl: 'page1.html'
})
export class Page1 {

  deviceList: Array<string> = [];
  deviceData: Object = {};
  //  idxList: Array<number> = [];
  sonosip: string = '192.168.178.22';

  deviceSubscription: any;
  // settings = defaultSettings;

  constructor(
    public navCtrl: NavController,
    public sonosService: SONOSService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    //this.domoticzService.initDomoticzService(this.settings); // to avoid issues when going to Page2 without startObserving
  }

  startObserving() {
    this.sonosService.initService([this.sonosip]);

    // set the initial list
    this.deviceList = [];

    // if we already observed stuff, then undo the subscription
    if (this.deviceSubscription !== undefined) {
      this.deviceSubscription.unsubscribe();
      // console.log('unsub');
    }

    // and start observing again
    this.deviceSubscription = this.sonosService.getSonosZoneObservable()
      .subscribe(
      value => {
        //console.log('value received', value);

        // if the device is already found, then don't add it
        if (typeof value['error'] === 'undefined')
        { if (this.deviceList.indexOf(value['ip']) == -1) this.deviceList.push(value['ip']); }
        // if an error is received, we kill the watcher and need to do something smart
        else {
          console.log('Error received', value);
          //this.sonosService.doneDomoticzService();
          this.deviceSubscription.unsubscribe();

          this.doToast('There was an issue accessing SONOS server');
        }

        // and replace the data
        this.deviceData[value['ip']] = value;
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
