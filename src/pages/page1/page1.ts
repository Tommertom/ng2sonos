import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { SONOSService } from './../../providers/sonos.provider';

@Component({
  selector: 'page-page1',
  templateUrl: 'page1.html'
})
export class Page1 {

  deviceList: Array<string> = [];
  deviceData: Object = {};
  deviceSubscription: any;

  sonosip: string = '192.168.178.22';

  debugInfo: string = "no debug";

  constructor(
    public navCtrl: NavController,
    public sonosService: SONOSService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    // this.startObserving();
  }

  startSUB() {
    this.sonosService.subscribeSonosEvents('192.168.178.22');
  }

  startObserving() {
    this.sonosService.initService([this.sonosip]);

    this.addDebug('test');

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
        // no error received?
        if (typeof value['error'] === 'undefined')
        // if the device is already found, then don't add it
        { if (this.deviceList.indexOf(value['ip']) == -1) this.deviceList.push(value['ip']); }

        // if an error is received, we kill the watcher and need to do something smart
        else {
          console.log('Error received', value);

          this.deviceSubscription.unsubscribe();

          this.doToast('There was an issue accessing SONOS server');
        }

        // and replace the data  
        this.deviceData[value['ip']] = value;
      },

      error => console.log(error));
  }

  addDebug(message) {
    this.debugInfo = this.debugInfo + ' - ' + message;
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
