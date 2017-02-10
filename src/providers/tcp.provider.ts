import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/Rx";

// plugin installation needed:
// ionic plugin add --save cordova-plugin-chrome-apps-sockets-tcp
// https://www.npmjs.com/package/cordova-plugin-chrome-apps-sockets-UDPService

declare var chrome;

@Injectable()
export class TCPService {

    private socketid: number;
    private tcpstream: BehaviorSubject<Object> = new BehaviorSubject({});
    private localAddress: string;


    constructor() { };


    sendTCPMessage(message2: string, address: string, port: number) {

        // convert string to ArrayBuffer - taken from Chrome Developer page
        function str2ab(str) {

            console.log("str", str);

            var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
            var bufView = new Uint16Array(buf);
            for (var i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }

        function ab2str(buf) {
            return String.fromCharCode.apply(null, new Uint8Array(buf));
        };


        console.log('Received ip', address);

        // only do udp stuff if there is plugin defined
        if (typeof chrome.sockets !== 'undefined') {

            var subscribeURL = 'http://192.168.178.22:1400/MediaRenderer/GroupRenderingControl/Event';

            // register the listeners
            chrome.sockets.tcp.onReceive.addListener(
                (info) => {
                    // we have found one 
                    console.log('Recv from socket: ', info, ab2str(info.data));
                    this.tcpstream.next(info);
                }
            );
            chrome.sockets.udp.onReceiveError.addListener(
                (error) => {
                    console.log('Recv  ERROR from socket: ', error);
                    this.tcpstream.next({ 'error': error });
                }
            );

            // translate the string into ArrayBuffer
            //  let SENDBUFFER = str2ab(message2);

            // send  the TCP MessageItem
            chrome.sockets.udp.create((createInfo) => {
                this.socketid = createInfo.socketId;
                console.log('Create socket ', createInfo, address, port);

                chrome.sockets.tcp.connect(createInfo.socketId, '192.168.178.22', 3400,
                    (resultCode) => {

                        if (resultCode < 0) { console.log('Error connect', resultCode) }
                        else chrome.sockets.tcp.getInfo(createInfo.socketId,

                            (getInfo) => {

                                console.log('Into getInfo', getInfo);

                                this.localAddress = getInfo.localAddress;

                                let strmessage = 'SUBSCRIBE ' + subscribeURL + '\nHOST: '
                                    + 'http://192.168.178.22' + ':1400\nCALLBACK: <http://'
                                    + getInfo.localAddress + ':' + getInfo.localPort
                                    + '/>\nNT: upnp:event\nTIMEOUT: Second-3600\n\n';

                                console.log('Stremsss', strmessage);

                                let message = str2ab(strmessage);

                                chrome.sockets.tcp.send(this.socketid, message,
                                    (sendresult) => { console.log('Send result', sendresult) });
                            });
                    }
                )
            }
            );

            // and close the listener after a while
            setTimeout(() => {
                this.closeTCPService();
            }, 10000);
        }
        // return the stream
        return this.tcpstream.asObservable().skip(1);
    }

    closeTCPService() {
        // close the socket
        if (typeof chrome.sockets !== 'undefined') chrome.sockets.tcp.disconnect(this.socketid);

        // close the stream
        this.tcpstream.complete();
    }

}


/*

var phrase = 'Hello World!';
    console.log(/^[A-Z]/.test(phrase));

var phrase = 'hello world!';
    console.log(/^[A-Z]/.test(phrase));


    var word = "Someword";
console.log( /[A-Z]/.test( word[0]) );
var str = "How are you doing today?";
var res = str.split(" ");

newpath.replace(/\\/g,"\\\\");

var ages = [32, 33, 16, 40];

function checkAdult(age) {
    return age >= 18;
}

function myFunction() {
    document.getElementById("demo").innerHTML = ages.filter(checkAdult);
}
Sort numbers in an array in ascending order:

var points = [40, 100, 1, 5, 25, 10];
points.sort(function(a, b){return a-b});


t.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.19:1400/MediaRenderer/GroupRenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.19:1400/MediaServer/ContentDirectory/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.43:1400/MediaRenderer/AVTransport/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.43:1400/MediaRenderer/RenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.43:1400/MediaRenderer/GroupRenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.43:1400/MediaServer/ContentDirectory/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.18:1400/MediaRenderer/AVTransport/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.18:1400/MediaRenderer/RenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.18:1400/MediaRenderer/GroupRenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.18:1400/MediaServer/ContentDirectory/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.22:1400/MediaRenderer/AVTransport/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.22:1400/MediaRenderer/RenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.22:1400/MediaRenderer/GroupRenderingControl/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
reuqest.js { headers:
   { TIMEOUT: 'Second-600',
     CALLBACK: '<http://192.168.178.11:3500/>',
     NT: 'upnp:event' },
  uri: 'http://192.168.178.22:1400/MediaServer/ContentDirectory/Event',
  method: 'SUBSCRIBE',
  type: 'stream' }
ZONES [ { coordinator:

*/
