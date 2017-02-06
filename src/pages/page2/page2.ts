import { Component, ViewChild } from '@angular/core';
import { ToastController, NavController } from 'ionic-angular';
import { SONOSService } from './../../providers/sonos.provider';

import { Http, Headers, RequestMethod, RequestOptions } from '@angular/http';

import * as xml2js from "xml2js";
import * as XML  from 'pixl-xml';

//declare module 'pixl-xml';

/*

Parser
:
XML(args, opts)
XML
:
XML(args, opts)
alwaysArray
:
always_array(obj, key)
decodeEntities
:
decode_entities(text)
encodeAttribEntities
:
encode_attrib_entities(text)
encodeEntities
:
encode_entities(text)
firstKey
:
first_key(hash)
hashKeysToArray
:
hash_keys_to_array(hash)
isaArray
:
isa_array(arg)
isaHash
:
isa_hash(arg)
numKeys
:
num_keys(hash)
parse
:
parse_xml(text, opts)
stringify
:
compose_xml(node, name, indent, indent_string, eol)
trim
:
trim(text)
__proto__
:
Object

*/


@Component({
  selector: 'page-page2',
  templateUrl: 'page2.html'
})
export class Page2 {

  deviceList: Array<string> = [];

  deviceData: Object = {};
  debugInfo: string = '';
  deviceSubscription: any;

  constructor(
    public navCtrl: NavController,
    public sonosService: SONOSService,
    private toastCtrl: ToastController,
    private http: Http
  ) { }

  ngOnInit() {
    this.startObserving();
    console.log('XML', XML);
  }

  getPositionInfo(ip) {
    this.sonosService.getPositionInfo(ip)
      .subscribe(val => {
        // this.doToast('posinfo' + JSON.stringify(val, null, 2));
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

        xml2js.parseString(val, (err, result) => {
							 console.log('zoneinfo', result);
						})
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
    this.sonosService.muteOrUnMute();
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

