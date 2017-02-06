import { Component } from '@angular/core';
import { ToastController, NavController } from 'ionic-angular';
import { SONOSService } from './../../providers/sonos.provider';

//import { Http, Headers, RequestMethod, RequestOptions } from '@angular/http';



@Component({
  selector: 'page-page2',
  templateUrl: 'page2.html'
})
export class Page2 {

  deviceList: Array<string> = [];

  deviceData: Object = {};
  debugInfo: string = '';
  deviceSubscription: any;
  stateSubscription: any;

  constructor(
    public navCtrl: NavController,
    public sonosService: SONOSService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.startObserving();
  }

  getPositionInfo(ip) {
    this.sonosService.getPositionInfo(ip)
      .subscribe(val => {
        this.debugInfo = JSON.stringify(val, null, 2);
        console.log('positioninfo', val);
      });
  }

  volumeUp(ip) {
    this.sonosService.volumeSonos('20', ip);
  }

  zoneInfo(ip) {
    this.sonosService.getZoneInfo(ip)
      .subscribe(val => {
        // this.doToast('posinfo' + JSON.stringify(val, null, 2));
        this.debugInfo = JSON.stringify(val, null, 2);
      });
  }

  getVolume(ip) {
    this.sonosService.getZoneVolume(ip)
      .subscribe(val => {
        // this.doToast('posinfo' + JSON.stringify(val, null, 2));
        this.debugInfo = JSON.stringify(val, null, 2);
      });
  }


  getTransportInfo(ip) {
    this.sonosService.getTransportInfo(ip)
      .subscribe(val => {
        // this.doToast('posinfo' + JSON.stringify(val, null, 2));
        this.debugInfo = JSON.stringify(val, null, 2);
        console.log('transortinfo', val);
      });
  }


  volumeDown(ip) {
    this.sonosService.volumeSonos('5', ip);
  }

  muteOrUnMute() {
    //this.sonosService.muteOrUnMute();
  }


  startObserving() {
    // set the initial list
    this.deviceList = [];

    // if we already observed stuff, then undo the subscription
    if (this.deviceSubscription !== undefined) {
      this.deviceSubscription.unsubscribe();
    }
    
    // if we already observed stuff, then undo the subscription
    if (this.stateSubscription !== undefined) {
      this.stateSubscription.unsubscribe();
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

        // complete some of the data for the view
        this.deviceData[ip]['iconurl'] = 'http://' + ip + ':1400' + value['device_description']['iconList']['icon']['url'];
      },

      error => console.log(error),
      () => console.log('Finished device update')
      );


    // and start observing again
    this.stateSubscription = this.sonosService.getSonosStateObservable()
      .subscribe(
      value => {
        // only add state for devices we know
        if (this.deviceList.indexOf(value['ip']) != -1) {
          // and replace the data
          let ip = value['ip'];
          this.deviceData[ip]['state'] = value;

          console.log('state receiver', this.deviceData);
        }
      },
      error => console.log(error),
      () => console.log('Finished state update')
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

