# Angular2 SONOS Service demonstration
Sonos service which deploys Observable technique to watch for changes, creating great async usage.

Including API calls to control the Sonos.

Wrapped in Ionic 2 demo app (sidemenu).

## Todo
* Do the initial setup - NOTHING IS WORKING YET!!!! (CODE REFACTORING NEEDED)
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
xml2js `npm install xml2js --save` and typings `typings install dt~xml2js --save`. 

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

There are a number of of methods in the service you can use to send actions to a Sonos Zone/Coordinator:
```

```
Where `??` is the unique id of the sonos zone/coordinator.

## Important!
Use at own discretion, but if you have any suggestion, let me know or do a PR. 

Provided under Apache2 License.
