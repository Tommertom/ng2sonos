
import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/Rx";

// UDP implementation using chrome.sockets
// Based on https://github.com/siboulet/zonos/blob/master/upnp.js
// and https://forum.ionicframework.com/t/tcp-sockets-in-ionic-2/67806

// DOES NOT WORK AS chrome.sockets is not present


@Injectable()
export class UDPChromeService {

    private socketid: number;
    private udpstream: BehaviorSubject<Object> = new BehaviorSubject({});


    constructor() { };

    sendUDPMessage(message: string, port: number, addresses: Array<string>, ttl: number, timetolisten: number) {

        let chromesocket = (<any>window).chrome;
        let searchTarget = 'ssdp:all'

        // convert string to ArrayBuffer - taken from Chrome Developer page
        function str2ab(str) {
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


        console.log('fassda', (<any>window), (<any>window).chrome, (<any>window).chrome.sockets);

        (<any>window).chrome.sockets.tcp.create('udp',
            (socket) => {
                this.socketid = socket.socketId;

                chromesocket.socket.bind(socket.socketId, '0.0.0.0', 1901,
                    (result) => {
                        let message = str2ab('M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 10\r\nST: ' + searchTarget + '\r\n\r\n');
                        chromesocket.socket.sendTo(socket.socketId, message, '239.255.255.250', 1900, function (result) { });
                    }
                );
            });


        setTimeout(
            chromesocket.socket.recvFrom(this.socketid, (data) => {
                console.log('Data UDP', data);
                console.log('Data UDP', JSON.stringify(data));
                console.log('Data Data', ab2str(data.data));

                this.udpstream.next({ data: data });

            }), 100);

        return this.udpstream.asObservable().skip(1);

    }

    closeUDPService() {

        // close the stream
        this.udpstream.complete();
    }

}
