import { Component, ViewChild } from '@angular/core';
import { ToastController, NavController } from 'ionic-angular';
import { SONOSService } from './../../providers/sonos.provider';


@Component({
  selector: 'page-page2',
  templateUrl: 'page2.html'
})
export class Page2 {

  deviceList: Array<string> = [];
  deviceData: Object = {};

  deviceSubscription: any;

  constructor(
    public navCtrl: NavController,
    public sonosService: SONOSService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.startObserving();
  }

  getPositionInfo(ip) {
    this.sonosService.getPositionInfo(ip);
  }

  volumeUp(ip) {
    this.sonosService.volumeSonos('+1', ip);
  }

  startObserving() {
    // set the initial list
    this.deviceList = [];

    // if we already observed stuff, then undo the subscription
    if (this.deviceSubscription !== undefined) {
      this.deviceSubscription.unsubscribe();
    }

    // and start observing again
    this.deviceSubscription = this.sonosService.getSonosZoneObservable()
      .subscribe(
      value => {

        // if the device is already found, then don't add it
        if (this.deviceList.indexOf(value['ip']) == -1) this.deviceList.push(value['ip']);

        // and replace the data
        let ip = value['ip'];
        this.deviceData[ip] = value;

        //console.log('stuff', value['device_description']['iconList'][0]['icon'][0]['url'][0] ); //['device_description']

        // complete some of the data for the view
        this.deviceData[ip]['iconurl'] = 'http://' + ip + ':1400' + value['device_description']['iconList'][0]['icon'][0]['url'][0];
        // console.log('stuff', this.deviceData[value['ip']]['iconurl']);
      },

      error => console.log(error),
      () => console.log('Finished')
      );
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
      console.log('Dismissed toast');
    });

    toast.present();
  }

}

