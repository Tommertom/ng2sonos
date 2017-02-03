# Angular 2 SONOS Service demonstration
Sonos service in Angular2 which deploys Observable technique to watch for changes, creating great async usage.

Including API calls to control the Sonos.

Wrapped in Ionic 2 demo app (sidemenu).

## Todo
* Do the initial setup - UI is not very informative, lots of stuff happening under the hood
* Add services and methods (subscriptions to changes, play/stop etc.)
* Error handling (if wrong server is added, no response, wrong response)
* Documentation and comments
* Create automated tests

## Getting Started
* Install Node.JS and npm (https://nodejs.org/en/download/), as well as git (https://git-scm.com/downloads)
* Clone this repository: `git clone https://github.com/Tommertom/ng2sonos.git`.
* Run `npm install` from the project root.
* Install the ionic CLI and Cordova (`npm install -g ionic@latest cordova@latest`) - although Cordova is not used (yet)
* Run `ionic serve` in a terminal from the project root.

The project will need the UDP cordova plugin to run (for Sonos discovery): `ionic plugin add cordova-plugin-chrome-apps-sockets-udp`, 
xml2js `npm install typings xml2js --save` and typings `typings install dt~xml2js --save`. 

Due to cross-origin restrictions, this may not work in a browser (although it does with me). So you may need to `ionic run android` or `ionic run ios` to a device 
or upload in ionic view to see it working. 

This demo is available in Ionic View (similar to Apple's Testflight) under app ID `fb42ab33`. Download Ionic View in your app store (android/iOS), register free 
Ionic account (https://apps.ionic.io/signup) and enjoy. Assure you do a `Clear App Data` in Ionic View
if you want to enjoy the latest committed version.

## Usage of the service

* Embed the service as provider in your project - this version only supports one server per provider
* When ready to start observing, do an initial `initSonosService([`IP adresses`])` which will try to configure the service using the IP adresses in the arrayand will start regular polling of Data
* If you initiate the service with empty array, the service will try to do a discovery through UDP, which may take a while before it will start emitting Sonos data
* Get the Obserable for the Sonos. 
```
getSonosZoneObservable() : emitting Sonos zone playstates
getSonosCoordinatorObservable()  : emitting Sonos coordinator playstates
```
* Using RxJS operators, you can manipulate the datastream and subscribe for actions
* Using `refreshSonos()` you can force a refresh of all data being observed
* When you want to stop the service from working, do a `doneSonosService()`.

Please note, the service emits one value per sonos zone or coordinator, and the full set when you get the observer 
and will continue so until the service is stopped or the app killed.  This means the stream is hot from the start, 
will send initial data whenever you get the Observable and will only do a `complete()` when explicitly ended. The latter
means that some of the RxJS operators (e.g. `toArray()`) won't give any results until the service is stopped.

When the service has encountered an error, it will emit `{ error: err }`, where `err` stands for the error object taken from the HTTP Response.
If no Sonos topology was found, the emitted error will be `{error: 'No topology'}`.

There are a number of of methods in the service you can use to send actions to a Sonos Zone/Coordinator:
```
    setEQ(eqType, value, IP) 
	playSonos(IP) 
	pauseSonos(IP)
	stopSonos(IP) 
	nextSonos(IP) 
	previousSonos(IP)
	muteSonos(mute, IP)
	volumeSonos(volume, IP)
	getPositionInfo(IP)
```
Where `IP` is the unique IP of the sonos zone/coordinator.

## Important!
Use at own discretion, but if you have any suggestion, let me know or do a PR. 

Provided under Apache2 License.

### Layout of emitted values (JSON conversion from XML output)

Zone/Coordinator:
```
{
  "group": "RINCON_XXXXXXXXX01400:0",
  "coordinator": "true",
  "wirelessmode": "1",
  "wirelessleafonly": "0",
  "hasconfiguredssid": "1",
  "channelfreq": "2437",
  "behindwifiext": "0",
  "wifienabled": "1",
  "location": "http://192.168.178.43:1400/xml/device_description.xml",
  "version": "34.16-37101",
  "mincompatibleversion": "33.0-00000",
  "legacycompatibleversion": "25.0-00000",
  "bootseq": "4",
  "uuid": "RINCON_XXXXXXXXX01400",
  "roomname": "Kitchen",
  "ip": "192.168.178.43",
  "device_description": {
    "deviceType": [
      "urn:schemas-upnp-org:device:ZonePlayer:1"
    ],
    "friendlyName": [
      "192.168.178.43 - Sonos PLAY:1"
    ],
    "manufacturer": [
      "Sonos, Inc."
    ],
    "manufacturerURL": [
      "http://www.sonos.com"
    ],
    "modelNumber": [
      "S12"
    ],
    "modelDescription": [
      "Sonos PLAY:1"
    ],
    "modelName": [
      "Sonos PLAY:1"
    ],
    "modelURL": [
      "http://www.sonos.com/products/zoneplayers/S12"
    ],
    "softwareVersion": [
      "34.16-37101"
    ],
    "hardwareVersion": [
      "1.20.1.6-2"
    ],
    "serialNum": [
      "XX-XX-XX-XX-XX-XX:6"
    ],
    "UDN": [
      "uuid:RINCON_XXXXXXXXX01400"
    ],
    "iconList": [
      {
        "icon": [
          {
            "id": [
              "0"
            ],
            "mimetype": [
              "image/png"
            ],
            "width": [
              "48"
            ],
            "height": [
              "48"
            ],
            "depth": [
              "24"
            ],
            "url": [
              "/img/icon-S12.png"
            ]
          }
        ]
      }
    ],
    "minCompatibleVersion": [
      "33.0-00000"
    ],
    "legacyCompatibleVersion": [
      "25.0-00000"
    ],
    "displayVersion": [
      "7.1"
    ],
    "extraVersion": [
      ""
    ],
    "roomName": [
      "Kitchen"
    ],
    "displayName": [
      "PLAY:1"
    ],
    "zoneType": [
      "14"
    ],
    "feature1": [
      "0x00000000"
    ],
    "feature2": [
      "0x00403332"
    ],
    "feature3": [
      "0x0001000e"
    ],
    "variant": [
      "1"
    ],
    "internalSpeakerSize": [
      "5"
    ],
    "bassExtension": [
      "75.000"
    ],
    "satGainOffset": [
      "6.000"
    ],
    "memory": [
      "256"
    ],
    "flash": [
      "256"
    ],
    "ampOnTime": [
      "10"
    ],
    "serviceList": [
      {
        "service": [
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:AlarmClock:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:AlarmClock"
            ],
            "controlURL": [
              "/AlarmClock/Control"
            ],
            "eventSubURL": [
              "/AlarmClock/Event"
            ],
            "SCPDURL": [
              "/xml/AlarmClock1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:MusicServices:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:MusicServices"
            ],
            "controlURL": [
              "/MusicServices/Control"
            ],
            "eventSubURL": [
              "/MusicServices/Event"
            ],
            "SCPDURL": [
              "/xml/MusicServices1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:DeviceProperties:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:DeviceProperties"
            ],
            "controlURL": [
              "/DeviceProperties/Control"
            ],
            "eventSubURL": [
              "/DeviceProperties/Event"
            ],
            "SCPDURL": [
              "/xml/DeviceProperties1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:SystemProperties:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:SystemProperties"
            ],
            "controlURL": [
              "/SystemProperties/Control"
            ],
            "eventSubURL": [
              "/SystemProperties/Event"
            ],
            "SCPDURL": [
              "/xml/SystemProperties1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:ZoneGroupTopology:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:ZoneGroupTopology"
            ],
            "controlURL": [
              "/ZoneGroupTopology/Control"
            ],
            "eventSubURL": [
              "/ZoneGroupTopology/Event"
            ],
            "SCPDURL": [
              "/xml/ZoneGroupTopology1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-upnp-org:service:GroupManagement:1"
            ],
            "serviceId": [
              "urn:upnp-org:serviceId:GroupManagement"
            ],
            "controlURL": [
              "/GroupManagement/Control"
            ],
            "eventSubURL": [
              "/GroupManagement/Event"
            ],
            "SCPDURL": [
              "/xml/GroupManagement1.xml"
            ]
          },
          {
            "serviceType": [
              "urn:schemas-tencent-com:service:QPlay:1"
            ],
            "serviceId": [
              "urn:tencent-com:serviceId:QPlay"
            ],
            "controlURL": [
              "/QPlay/Control"
            ],
            "eventSubURL": [
              "/QPlay/Event"
            ],
            "SCPDURL": [
              "/xml/QPlay1.xml"
            ]
          }
        ]
      }
    ],
    "deviceList": [
      {
        "device": [
          {
            "deviceType": [
              "urn:schemas-upnp-org:device:MediaServer:1"
            ],
            "friendlyName": [
              "192.168.178.43 - Sonos PLAY:1 Media Server"
            ],
            "manufacturer": [
              "Sonos, Inc."
            ],
            "manufacturerURL": [
              "http://www.sonos.com"
            ],
            "modelNumber": [
              "S12"
            ],
            "modelDescription": [
              "Sonos PLAY:1 Media Server"
            ],
            "modelName": [
              "Sonos PLAY:1"
            ],
            "modelURL": [
              "http://www.sonos.com/products/zoneplayers/S12"
            ],
            "UDN": [
              "uuid:RINCON_XXXXXXXXX01400_MS"
            ],
            "serviceList": [
              {
                "service": [
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:ContentDirectory:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:ContentDirectory"
                    ],
                    "controlURL": [
                      "/MediaServer/ContentDirectory/Control"
                    ],
                    "eventSubURL": [
                      "/MediaServer/ContentDirectory/Event"
                    ],
                    "SCPDURL": [
                      "/xml/ContentDirectory1.xml"
                    ]
                  },
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:ConnectionManager:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:ConnectionManager"
                    ],
                    "controlURL": [
                      "/MediaServer/ConnectionManager/Control"
                    ],
                    "eventSubURL": [
                      "/MediaServer/ConnectionManager/Event"
                    ],
                    "SCPDURL": [
                      "/xml/ConnectionManager1.xml"
                    ]
                  }
                ]
              }
            ]
          },
          {
            "deviceType": [
              "urn:schemas-upnp-org:device:MediaRenderer:1"
            ],
            "friendlyName": [
              "Kitchen - Sonos PLAY:1 Media Renderer"
            ],
            "manufacturer": [
              "Sonos, Inc."
            ],
            "manufacturerURL": [
              "http://www.sonos.com"
            ],
            "modelNumber": [
              "S12"
            ],
            "modelDescription": [
              "Sonos PLAY:1 Media Renderer"
            ],
            "modelName": [
              "Sonos PLAY:1"
            ],
            "modelURL": [
              "http://www.sonos.com/products/zoneplayers/S12"
            ],
            "UDN": [
              "uuid:RINCON_XXXXXXXXX01400_MR"
            ],
            "serviceList": [
              {
                "service": [
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:RenderingControl:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:RenderingControl"
                    ],
                    "controlURL": [
                      "/MediaRenderer/RenderingControl/Control"
                    ],
                    "eventSubURL": [
                      "/MediaRenderer/RenderingControl/Event"
                    ],
                    "SCPDURL": [
                      "/xml/RenderingControl1.xml"
                    ]
                  },
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:ConnectionManager:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:ConnectionManager"
                    ],
                    "controlURL": [
                      "/MediaRenderer/ConnectionManager/Control"
                    ],
                    "eventSubURL": [
                      "/MediaRenderer/ConnectionManager/Event"
                    ],
                    "SCPDURL": [
                      "/xml/ConnectionManager1.xml"
                    ]
                  },
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:AVTransport:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:AVTransport"
                    ],
                    "controlURL": [
                      "/MediaRenderer/AVTransport/Control"
                    ],
                    "eventSubURL": [
                      "/MediaRenderer/AVTransport/Event"
                    ],
                    "SCPDURL": [
                      "/xml/AVTransport1.xml"
                    ]
                  },
                  {
                    "serviceType": [
                      "urn:schemas-sonos-com:service:Queue:1"
                    ],
                    "serviceId": [
                      "urn:sonos-com:serviceId:Queue"
                    ],
                    "controlURL": [
                      "/MediaRenderer/Queue/Control"
                    ],
                    "eventSubURL": [
                      "/MediaRenderer/Queue/Event"
                    ],
                    "SCPDURL": [
                      "/xml/Queue1.xml"
                    ]
                  },
                  {
                    "serviceType": [
                      "urn:schemas-upnp-org:service:GroupRenderingControl:1"
                    ],
                    "serviceId": [
                      "urn:upnp-org:serviceId:GroupRenderingControl"
                    ],
                    "controlURL": [
                      "/MediaRenderer/GroupRenderingControl/Control"
                    ],
                    "eventSubURL": [
                      "/MediaRenderer/GroupRenderingControl/Event"
                    ],
                    "SCPDURL": [
                      "/xml/GroupRenderingControl1.xml"
                    ]
                  }
                ]
              }
            ],
            "X_Rhapsody-Extension": [
              {
                "$": {
                  "xmlns": "http://www.real.com/rhapsody/xmlns/upnp-1-0"
                },
                "deviceID": [
                  "urn:rhapsody-real-com:device-id-1-0:sonos_1:RINCON_XXXXXXXXX01400"
                ],
                "deviceCapabilities": [
                  {
                    "interactionPattern": [
                      {
                        "$": {
                          "type": "real-rhapsody-upnp-1-0"
                        }
                      }
                    ]
                  }
                ]
              }
            ],
            "qq:X_QPlay_SoftwareCapability": [
              {
                "_": "QPlay:2",
                "$": {
                  "xmlns:qq": "http://www.tencent.com"
                }
              }
            ],
            "iconList": [
              {
                "icon": [
                  {
                    "mimetype": [
                      "image/png"
                    ],
                    "width": [
                      "48"
                    ],
                    "height": [
                      "48"
                    ],
                    "depth": [
                      "24"
                    ],
                    "url": [
                      "/img/icon-S12.png"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

device_description summary (taken from device_description.xml):
```
UDN : Array[1]
ampOnTime : Array[1]
bassExtension : Array[1]
deviceList : Array[1]
deviceType : Array[1]
displayName : Array[1]
displayVersion : Array[1]
extraVersion : Array[1]
feature1 : Array[1]
feature2 : Array[1]
feature3 : Array[1]
flash : Array[1]
friendlyName : Array[1]
hardwareVersion : Array[1]
iconList : Array[1]
internalSpeakerSize : Array[1]
legacyCompatibleVersion : Array[1]
manufacturer : Array[1]
manufacturerURL : Array[1]
memory : Array[1]
minCompatibleVersion : Array[1]
modelDescription : Array[1]
modelName : Array[1]
modelNumber : Array[1]
modelURL : Array[1]
roomName : Array[1]
satGainOffset : Array[1]
serialNum : Array[1]
serviceList : Array[1]
softwareVersion : Array[1]
variant : Array[1]
zoneType : Array[1]
```

State:

```

```  