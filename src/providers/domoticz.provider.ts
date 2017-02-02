import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject } from "rxjs/Rx";

//
// Based on https://coryrylan.com/blog/angular-observable-data-services
//
//return this.createMarkerStyle(<MarkerSymbolInfo> symbolInfo); reateStyle( symbolInfo : SymbolInfo)
//// Original syntax
//var markerSymbolInfo = <MarkerSymbolInfo> symbolInfo;

// Newer additional syntax
//var markerSymbolInfo = symbolInfo as MarkerSymbolInfo;

export interface DomoticzSettingsModel {
    server: string;             // IP adress
    port: string;               // number as a string, with no colon ('8080')
    protocol: string;           // https:// or http://
    refreshdelay: number;       // the ms to wait before a full refresh
}

@Injectable()
export class DomoticzService {

    private settings: DomoticzSettingsModel;
    private doRefresh: boolean = false;
    private devices: BehaviorSubject<Object> = new BehaviorSubject({});
    private scenes: BehaviorSubject<Object> = new BehaviorSubject({});
    private plans: BehaviorSubject<Object> = new BehaviorSubject({});

    constructor(private http: Http) { };

    initDomoticzService(settings) {
        // check the settings
        this.settings = settings;

        // start refreshing
        this.doRefresh = true;
        this.repeatDomoticzRefresh();
    }

    refreshDomoticz() {
        this.emitAllDevices();
        this.emitAllPlans();
        this.emitAllScenes();
    }

    /**
       * Get observable to watch Domoticz Device data
       * 
       */
    getDomoticzDeviceObservable() {
        this.refreshDomoticz()

        // return the observable
        return this.devices.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
    }

    /**
       * Get observable to watch Domoticz Scenes data
       * 
       */
    getDomoticzSceneObservable() {
        this.refreshDomoticz()

        // return the observable
        return this.scenes.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    getDomoticzPlanObservable() {
        this.refreshDomoticz()

        // return the observable
        return this.plans.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    doneDomoticzService() {
        // stop pulling data
        this.doRefresh = false;

        // and finish the streams
        this.devices.complete();
        this.plans.complete();
        this.scenes.complete();
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    toggleDevice(idx: string) {
        this.callAPI(
            '/json.htm?type=command&param=switchlight&idx=[IDX]&switchcmd=Toggle',
            { '[IDX]': idx })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    setDeviceDimLevel(idx: string, level: number) {
        this.callAPI(
            '/json.htm?type=command&param=switchlight&idx=[IDX]&switchcmd=Set%20Level&level=[LEVEL]',
            { '[IDX]': idx, '[LEVEL]': level })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }


    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    setDeviceSetPoint(idx: string, setpoint: number) {
        this.callAPI(
            '/json.htm?type=command&param=setsetpoint&idx=[IDX]&setpoint=[SETPOINT]',
            { '[IDX]': idx, '[SETPOINT]': setpoint })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    switchDeviceOn(idx: string) {
        this.callAPI(
            '/json.htm?type=command&param=switchlight&idx=[IDX]&switchcmd=On',
            { '[IDX]': idx })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Get observable to watch Domoticz Plan data
       * 
       */
    switchDeviceOff(idx: string) {
        this.callAPI(
            '/json.htm?type=command&param=switchlight&idx=[IDX]&switchcmd=Off',
            { '[IDX]': idx })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Switch a scene on
       * 
       */
    switchSceneOn(idx: string) {
        this.callAPI(
            '/json.htm?type=command&param=switchscene&idx=[IDX]&switchcmd=On',
            { '[IDX]': idx })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Switch a scene off
       * 
       */
    switchSceneOff(idx: string) {
        this.callAPI(
            '/json.htm?type=command&param=switchscene&idx=[IDX]&switchcmd=Off',
            { '[IDX]': idx })
            .subscribe(
            () => { },
            () => { this.emitOneDevice(idx) },
            () => { this.emitOneDevice(idx) });
    }

    /**
       * Add message to the log
       * 
       */
    addLog(message: string) {
        this.callAPI(
            '/json.htm?type=command&param=addlogmessage&message=[MESSAGE]',
            { '[MESSAGE]': message });
    }


    //
    //
    // all private methods follow here
    //
    //
    private callAPI(api: string, payload: Object) {
        // do a search-replace of all the update data available and then do the HTTP request, 
        for (var key in payload)
            api = api.replace(key, payload[key]); // should do this until all occurences as gone, TODO

        //console.log('API call', api, payload);

        return this.http.get(
            this.settings.protocol +
            this.settings.server + ':' +
            this.settings.port + api);
    }

    private repeatDomoticzRefresh() {

        // refresh all observables
        this.refreshDomoticz();

        //and repeat yourself if needed
        if (this.doRefresh)
            setTimeout(() => {
                this.repeatDomoticzRefresh()
            }, this.settings.refreshdelay);
    }

    private doHTTPForSubject(url: string, subject: BehaviorSubject<Object>) {
        this.http.get(url)
            .map(res => res.json())
            .mergeMap(res => res['result'])
            .subscribe(item => {
                subject.next(item);
            }, (err) => {
                console.log('Error in doHTTPForSubject', url, err);
                subject.next({ error: err });
            });
    }

    private emitAllDevices() {
        let url = this.settings.protocol +
            this.settings.server + ':' +
            this.settings.port +
            '/json.htm?type=devices&used=true&order=Name';

        this.doHTTPForSubject(url, this.devices);
    }

    private emitOneDevice(idx) {
        let url = this.settings.protocol +
            this.settings.server + ':' +
            this.settings.port +
            '/json.htm?type=devices&rid=' + idx;

        this.doHTTPForSubject(url, this.devices);
    }

    private emitAllScenes() {
        let url = this.settings.protocol +
            this.settings.server + ':' +
            this.settings.port +
            '/json.htm?type=scenes';

        this.doHTTPForSubject(url, this.scenes);
    }

    // TODO: enrich plan data with array of device IDX linked to the plan
    // for each plan: /json.htm?type=command&param=getplandevices&idx=2
    private emitAllPlans() {
        let url = this.settings.protocol +
            this.settings.server + ':' +
            this.settings.port +
            '/json.htm?type=plans&order=name&used=true';

        this.doHTTPForSubject(url, this.plans);
    }
}

/*
Sample Domoticz 

{
   "ActTime" : 1485936044,
   "result" : [
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "20.15%",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "0000044C",
         "Image" : "Computer",
         "LastUpdate" : "2017-02-01 08:00:21",
         "Name" : "Memory Usage",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Percentage",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "hardware",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "1"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "34.77%",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "0000044E",
         "Image" : "Computer",
         "LastUpdate" : "2017-02-01 08:00:22",
         "Name" : "HDD /boot",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Percentage",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "hardware",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "2"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "77.95%",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "0000044F",
         "Image" : "Computer",
         "LastUpdate" : "2017-02-01 08:00:22",
         "Name" : "Unknown",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Percentage",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "hardware",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "3"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "59.30%",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "00000450",
         "Image" : "Computer",
         "LastUpdate" : "2017-02-01 08:00:23",
         "Name" : "HDD /media/mnt1",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Percentage",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "hardware",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "4"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 100,
         "CustomImage" : 0,
         "Data" : "34.7 C",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "0001",
         "LastUpdate" : "2017-02-01 08:00:23",
         "Name" : "Internal Temperature",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "TFA 30.3133",
         "Temp" : 34.70,
         "Timers" : "false",
         "Type" : "Temp",
         "TypeImg" : "temperature",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "5"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "21.67%",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 1,
         "HardwareName" : "Motherboard",
         "HardwareType" : "Motherboard sensors",
         "HardwareTypeVal" : 23,
         "HaveTimeout" : false,
         "ID" : "0000044D",
         "Image" : "Computer",
         "LastUpdate" : "2017-02-01 08:00:21",
         "Name" : "CPU_Usage",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Percentage",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "hardware",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "6"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Off",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : false,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "67",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2015-11-06 18:52:16",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "Virtual doorbell",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "Off",
         "StrParam1" : "c2NyaXB0Oi8vL2hvbWUvcGkvZG9tb3RpY3ovc2NyaXB0cy9kb29yYmVsbC5waHA=",
         "StrParam2" : "",
         "SubType" : "X10",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "lightbulb",
         "Unit" : 5,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "9"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : false,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "69",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-08 21:03:35",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "Shutdown Pi",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "On",
         "StrParam1" : "c2NyaXB0Oi8vL2hvbWUvcGkvZG9tb3RpY3ovc2NyaXB0cy9zaHV0ZG93bi5zaA==",
         "StrParam2" : "c2NyaXB0Oi8vL2hvbWUvcGkvZG9tb3RpY3ovc2NyaXB0cy9zaHV0ZG93bi5zaA==",
         "SubType" : "X10",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "lightbulb",
         "Unit" : 7,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "12"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 100,
         "CustomImage" : 0,
         "Data" : "43.6 C",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 4,
         "HardwareName" : "1-Wire",
         "HardwareType" : "1-Wire (System)",
         "HardwareTypeVal" : 12,
         "HaveTimeout" : false,
         "ID" : "C5FC",
         "LastUpdate" : "2017-02-01 08:00:37",
         "Name" : "Aanvoercv",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "TFA 30.3133",
         "Temp" : 43.60,
         "Timers" : "false",
         "Type" : "Temp",
         "TypeImg" : "temperature",
         "Unit" : 252,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "13"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : false,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "72",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-29 10:24:58",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "teller webcam",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "X10",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "14"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 3,
         "HardwareName" : "Gpio",
         "HardwareType" : "Raspberry's GPIO port",
         "HardwareTypeVal" : 32,
         "HaveDimmer" : false,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "0",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2016-11-05 21:16:28",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "Relay switch",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "Impuls",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "lightbulb",
         "Unit" : 27,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "15"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Open",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 3,
         "HardwareName" : "Gpio",
         "HardwareType" : "Raspberry's GPIO port",
         "HardwareTypeVal" : 32,
         "HaveDimmer" : false,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "0",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-22 16:12:39",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "Doorbell GPIO",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "Open",
         "StrParam1" : "c2NyaXB0Oi8vL2hvbWUvcGkvZG9tb3RpY3ovc2NyaXB0cy9kb29yYmVsbC5waHA=",
         "StrParam2" : "c2NyaXB0Oi8vL2hvbWUvcGkvZG9tb3RpY3ovc2NyaXB0cy9kb29yYmVsbC5waHA=",
         "SubType" : "Impuls",
         "SwitchType" : "Contact",
         "SwitchTypeVal" : 2,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "contact",
         "Unit" : 2,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "16"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : false,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "65",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-29 10:24:08",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 0,
         "Name" : "Temp over 43",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "X10",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 1",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "17"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "26.0",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "ID" : "0014061",
         "LastUpdate" : "2015-11-04 20:46:05",
         "Name" : "V_Thermostat",
         "Notifications" : "false",
         "PlanID" : "2",
         "PlanIDs" : [ 2 ],
         "Protected" : false,
         "SetPoint" : "26.0",
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "SetPoint",
         "Timers" : "false",
         "Type" : "Thermostat",
         "TypeImg" : "override_mini",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "279",
         "YOffset" : "32",
         "idx" : "18"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "65 dB",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "ID" : "82018",
         "LastUpdate" : "2015-10-25 11:34:39",
         "Name" : "V_Volume",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "Sound Level",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "Speaker",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "19"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "Counter" : "0.000",
         "CounterDeliv" : "0.000",
         "CounterDelivToday" : "0.000 kWh",
         "CounterToday" : "0.000 kWh",
         "CustomImage" : 0,
         "Data" : "0;0;0;0;0;0",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "ID" : "82019",
         "LastUpdate" : "2015-11-04 20:48:04",
         "Name" : "V_Smartenergy",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 10,
         "SubType" : "Energy",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "P1 Smart Meter",
         "TypeImg" : "counter",
         "Unit" : 1,
         "Usage" : "0 Watt",
         "UsageDeliv" : "0 Watt",
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "20"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CounterToday" : "0.000 kWh",
         "CustomImage" : 0,
         "Data" : "0.000 kWh",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "ID" : "00014064",
         "LastUpdate" : "2015-11-04 20:52:52",
         "Name" : "V_Energy",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 10,
         "SubType" : "kWh",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "current",
         "Unit" : 1,
         "Usage" : "0.0 Watt",
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "21"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Hello World",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : false,
         "ID" : "82021",
         "LastUpdate" : "2015-11-04 20:55:14",
         "Name" : "hdw_Sonos",
         "Notifications" : "false",
         "PlanID" : "2",
         "PlanIDs" : [ 2 ],
         "Protected" : false,
         "ShowNotifications" : false,
         "SignalLevel" : "-",
         "SubType" : "Text",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "text",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "572",
         "YOffset" : "103",
         "idx" : "22"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Hello World",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : false,
         "ID" : "82022",
         "LastUpdate" : "2015-11-04 20:56:13",
         "Name" : "hdw_DateTimeNews",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : false,
         "SignalLevel" : "-",
         "SubType" : "Text",
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "text",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "23"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 100,
         "CustomImage" : 0,
         "Data" : "30.1 C",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 4,
         "HardwareName" : "1-Wire",
         "HardwareType" : "1-Wire (System)",
         "HardwareTypeVal" : 12,
         "HaveTimeout" : true,
         "ID" : "FFA2",
         "LastUpdate" : "2015-11-21 19:19:16",
         "Name" : "Unknown",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "TFA 30.3133",
         "Temp" : 30.10,
         "Timers" : "false",
         "Type" : "Temp",
         "TypeImg" : "temperature",
         "Unit" : 162,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "24"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Auto",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 8,
         "HardwareName" : "Evohome",
         "HardwareType" : "Evohome via script",
         "HardwareTypeVal" : 40,
         "HaveDimmer" : false,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "92024",
         "LastUpdate" : "2016-01-14 20:38:11",
         "MaxDimLevel" : 0,
         "Name" : "Unknown",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 10,
         "Status" : "Auto",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "Evohome",
         "SwitchType" : "evohome",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Heating",
         "TypeImg" : "override_mini",
         "Unit" : 0,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "25"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CounterToday" : "1.725 kWh",
         "CustomImage" : 0,
         "Data" : "120.453 kWh",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 9,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Winddelen",
         "HardwareTypeVal" : 57,
         "HaveTimeout" : false,
         "ID" : "00001F01",
         "LastUpdate" : "2017-02-01 08:00:39",
         "Name" : "Wind Power",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "kWh",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "General",
         "TypeImg" : "current",
         "Unit" : 1,
         "Usage" : "234.0 Watt",
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "26"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Set Level: 100 %, Level: 100 %",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "001406A",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-31 20:26:18",
         "Level" : 100,
         "LevelInt" : 15,
         "MaxDimLevel" : 15,
         "Name" : "Switch test Tom2",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "Set Level: 100 %",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "AC",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 2",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "27"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Set Level: 100 %, Level: 100 %",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : true,
         "HaveTimeout" : false,
         "ID" : "001406B",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-02-01 07:56:21",
         "Level" : 100,
         "LevelInt" : 15,
         "MaxDimLevel" : 15,
         "Name" : "Switch test Tom",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : 7,
         "Status" : "Set Level: 100 %",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "AC",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting 2",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "28"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "82028",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-08 20:04:01",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 100,
         "Name" : "Virtual RGB switch",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "RGB",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting Limitless/Applamp",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "29"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Off",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "00082028",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-02-01 07:57:21",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 100,
         "Name" : "APPLAMPRGB",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "Off",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "RGB",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting Limitless/Applamp",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "30"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "20.5",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "ID" : "001406E",
         "LastUpdate" : "2017-01-08 20:19:19",
         "Name" : "ThermostatSetpoint",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "SetPoint" : "20.5",
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "SetPoint",
         "Timers" : "false",
         "Type" : "Thermostat",
         "TypeImg" : "override_mini",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "31"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "Barometer" : 1010,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "0.0 C, 50 %, 1010 hPa",
         "Description" : "",
         "DewPoint" : "-9.20",
         "Favorite" : 1,
         "Forecast" : 1,
         "ForecastStr" : "Sunny",
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveTimeout" : true,
         "Humidity" : 50,
         "HumidityStatus" : "Comfortable",
         "ID" : "1406F",
         "LastUpdate" : "2017-01-08 20:19:36",
         "Name" : "TempHumBar VIrtua",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "SubType" : "THB1 - BTHR918, BTHGN129",
         "Temp" : 0.0,
         "Timers" : "false",
         "Type" : "Temp + Humidity + Baro",
         "TypeImg" : "temperature",
         "Unit" : 1,
         "Used" : 1,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "32"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "82032",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-08 20:20:08",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 100,
         "Name" : "Virtual RGB switch2",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "RGB",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting Limitless/Applamp",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "33"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "Off",
         "Description" : "",
         "Favorite" : 1,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "00082032",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-02-01 07:34:08",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 100,
         "Name" : "LIGHT MOL",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "Off",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "RGB",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting Limitless/Applamp",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "34"
      },
      {
         "AddjMulti" : 1.0,
         "AddjMulti2" : 1.0,
         "AddjValue" : 0.0,
         "AddjValue2" : 0.0,
         "BatteryLevel" : 255,
         "CustomImage" : 0,
         "Data" : "On",
         "Description" : "",
         "Favorite" : 0,
         "HardwareID" : 2,
         "HardwareName" : "Virtual devi e",
         "HardwareType" : "Dummy (Does nothing, use for virtual switches only)",
         "HardwareTypeVal" : 15,
         "HaveDimmer" : true,
         "HaveGroupCmd" : false,
         "HaveTimeout" : false,
         "ID" : "82034",
         "Image" : "Light",
         "IsSubDevice" : false,
         "LastUpdate" : "2017-01-29 10:22:19",
         "Level" : 0,
         "LevelInt" : 0,
         "MaxDimLevel" : 100,
         "Name" : "APPLAMP",
         "Notifications" : "false",
         "PlanID" : "0",
         "PlanIDs" : [ 0 ],
         "Protected" : false,
         "ShowNotifications" : true,
         "SignalLevel" : "-",
         "Status" : "On",
         "StrParam1" : "",
         "StrParam2" : "",
         "SubType" : "RGB",
         "SwitchType" : "On/Off",
         "SwitchTypeVal" : 0,
         "Timers" : "false",
         "Type" : "Lighting Limitless/Applamp",
         "TypeImg" : "lightbulb",
         "Unit" : 1,
         "Used" : 1,
         "UsedByCamera" : false,
         "XOffset" : "0",
         "YOffset" : "0",
         "idx" : "35"
      }
   ],
   "status" : "OK",
   "title" : "Devices"
}

*/