import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { Page1 } from '../pages/page1/page1';

import { SONOSService } from './../providers/sonos.provider';
import { UDPService } from './../providers/udp.provider';
import { TCPService } from './../providers/tcp.provider';

import { Page2 } from '../pages/page2/page2';

@NgModule({
  declarations: [
    MyApp,
    Page1,
    Page2
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Page1,
    Page2
  ],
  providers: [TCPService, SONOSService, UDPService,
    { provide: ErrorHandler, useClass: IonicErrorHandler }]
})
export class AppModule { }
