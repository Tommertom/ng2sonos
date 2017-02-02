import { Injectable } from '@angular/core';

import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/find';

// package install 
//npm install xml2js --save
//typings install dt~xml2js --save
import * as xml2js from "xml2js"

// plugin install
//npm i cordova-plugin-chrome-apps-sockets-udp
//https://www.npmjs.com/package/cordova-plugin-chrome-apps-sockets-udp
declare var chrome;

import { HomeyDOMData } from './homeydom.provider';

import {
	HomeyService,
	HomeyData,
	HomeyAction,
	PanelItem
//	HomeyRule,
//	HomeyCondition,
//	HomeyOperator
} from '../models/homeydom.interfaces';

const defaultSettings = {
	SONOSIPs: ['192.178.168.18']
};

// taken from https://github.com/jishi/node-sonos-http-api
const SONOSSoapActions = {
	SetEQ: 'urn:schemas-upnp-org:service:RenderingControl:1#SetEQ',
	Play: 'urn:schemas-upnp-org:service:AVTransport:1#Play',
	Pause: 'urn:schemas-upnp-org:service:AVTransport:1#Pause',
	Stop: 'urn:schemas-upnp-org:service:AVTransport:1#Stop',
	Next: 'urn:schemas-upnp-org:service:AVTransport:1#Next',
	Previous: 'urn:schemas-upnp-org:service:AVTransport:1#Previous',
	Mute: 'urn:schemas-upnp-org:service:RenderingControl:1#SetMute',
	GroupMute: 'urn:schemas-upnp-org:service:GroupRenderingControl:1#SetGroupMute',
	Volume: 'urn:schemas-upnp-org:service:RenderingControl:1#SetVolume',
	Seek: 'urn:schemas-upnp-org:service:AVTransport:1#Seek',
	RemoveAllTracksFromQueue: 'urn:schemas-upnp-org:service:AVTransport:1#RemoveAllTracksFromQueue',
	RemoveTrackFromQueue: 'urn:schemas-upnp-org:service:AVTransport:1#RemoveTrackFromQueue',
	RemoveTrackRangeFromQueue: 'urn:schemas-upnp-org:service:AVTransport:1#RemoveTrackRangeFromQueue',
	ReorderTracksInQueue: 'urn:schemas-upnp-org:service:AVTransport:1#ReorderTracksInQueue',
	SaveQueue: 'urn:schemas-upnp-org:service:AVTransport:1#SaveQueue',
	SetPlayMode: 'urn:schemas-upnp-org:service:AVTransport:1#SetPlayMode',
	SetCrossfadeMode: 'urn:schemas-upnp-org:service:AVTransport:1#SetCrossfadeMode',
	GetPositionInfo: 'urn:schemas-upnp-org:service:AVTransport:1#GetPositionInfo',
	ConfigureSleepTimer: 'urn:schemas-upnp-org:service:AVTransport:1#ConfigureSleepTimer',
	SetAVTransportURI: 'urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI',
	Browse: 'urn:schemas-upnp-org:service:ContentDirectory:1#Browse',
	BecomeCoordinatorOfStandaloneGroup: 'urn:schemas-upnp-org:service:AVTransport:1#BecomeCoordinatorOfStandaloneGroup',
	RefreshShareIndex: 'urn:schemas-upnp-org:service:ContentDirectory:1#RefreshShareIndex',
	AddURIToQueue: 'urn:schemas-upnp-org:service:AVTransport:1#AddURIToQueue',
	AddMultipleURIsToQueue: 'urn:schemas-upnp-org:service:AVTransport:1#AddMultipleURIsToQueue',
	ListAvailableServices: 'urn:schemas-upnp-org:service:MusicServices:1#ListAvailableServices'
};

const SONOSSOAPTemplates = {
	SetEQ: '<u:SetEQ xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><EQType>{eqType}</EQType><DesiredValue>{value}</DesiredValue></u:SetEQ>',
	Play: '<u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Speed>1</Speed></u:Play>',
	Pause: '<u:Pause xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:Pause>',
	Stop: '<u:Stop xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:Stop>',
	Next: '<u:Next xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:Next>',
	Previous: '<u:Previous xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:Previous>',
	Mute: '<u:SetMute xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>{mute}</DesiredMute></u:SetMute>',
	GroupMute: '<u:SetGroupMute xmlns:u="urn:schemas-upnp-org:service:GroupRenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>{mute}</DesiredMute></u:SetGroupMute>',
	Volume: '<u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>{volume}</DesiredVolume></u:SetVolume>',
	Seek: '<u:Seek xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Unit>{unit}</Unit><Target>{value}</Target></u:Seek>',
	RemoveAllTracksFromQueue: '<u:RemoveAllTracksFromQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:RemoveAllTracksFromQueue>',
	RemoveTrackFromQueue: '<u:RemoveTrackFromQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><ObjectID>Q:0/{track}</ObjectID></u:RemoveTrackFromQueue>',
	RemoveTrackRangeFromQueue: '<u:RemoveTrackRangeFromQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><UpdateID>0</UpdateID><StartingIndex>{startIndex}</StartingIndex><NumberOfTracks>{numberOfTracks}</NumberOfTracks></u:RemoveTrackRangeFromQueue>',
	ReorderTracksInQueue: '<u:ReorderTracksInQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><UpdateID>0</UpdateID><StartingIndex>{startIndex}</StartingIndex><NumberOfTracks>{numberOfTracks}</NumberOfTracks><InsertBefore>{insertBefore}</InsertBefore></u:ReorderTracksInQueue>',
	SaveQueue: '<u:SaveQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Title>{title}</Title><ObjectID></ObjectID></u:SaveQueue>',
	SetPlayMode: '<u:SetPlayMode xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><NewPlayMode>{playMode}</NewPlayMode></u:SetPlayMode>',
	SetCrossfadeMode: '<u:SetCrossfadeMode xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><CrossfadeMode>{crossfadeMode}</CrossfadeMode></u:SetCrossfadeMode>',
	GetPositionInfo: '<u:GetPositionInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:GetPositionInfo>',
	ConfigureSleepTimer: '<u:ConfigureSleepTimer xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><NewSleepTimerDuration>{time}</NewSleepTimerDuration></u:ConfigureSleepTimer>',
	SetAVTransportURI: '<u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><CurrentURI>{uri}</CurrentURI><CurrentURIMetaData>{metadata}</CurrentURIMetaData></u:SetAVTransportURI>',
	Browse: '<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1"><ObjectID>{objectId}</ObjectID><BrowseFlag>BrowseDirectChildren</BrowseFlag><Filter /><StartingIndex>{startIndex}</StartingIndex><RequestedCount>{limit}</RequestedCount><SortCriteria /></u:Browse>',
	BecomeCoordinatorOfStandaloneGroup: '<u:BecomeCoordinatorOfStandaloneGroup xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:BecomeCoordinatorOfStandaloneGroup>',
	RefreshShareIndex: '<u:RefreshShareIndex xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1"><AlbumArtistDisplayOption></AlbumArtistDisplayOption></u:RefreshShareIndex>',
	AddURIToQueue: '<u:AddURIToQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><EnqueuedURI>{uri}</EnqueuedURI><EnqueuedURIMetaData>{metadata}</EnqueuedURIMetaData><DesiredFirstTrackNumberEnqueued>{desiredFirstTrackNumberEnqueued}</DesiredFirstTrackNumberEnqueued><EnqueueAsNext>{enqueueAsNext}</EnqueueAsNext></u:AddURIToQueue>',
	AddMultipleURIsToQueue: '<u:AddMultipleURIsToQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><UpdateID>0</UpdateID><NumberOfURIs>{amount}</NumberOfURIs><EnqueuedURIs>{uris}</EnqueuedURIs><EnqueuedURIsMetaData>{metadatas}</EnqueuedURIsMetaData><ContainerURI>{containerURI}</ContainerURI><ContainerMetaData>{containerMetadata}</ContainerMetaData><DesiredFirstTrackNumberEnqueued>{desiredFirstTrackNumberEnqueued}</DesiredFirstTrackNumberEnqueued><EnqueueAsNext>{enqueueAsNext}</EnqueueAsNext></u:AddMultipleURIsToQueue>',
	ListAvailableServices: '<u:ListAvailableServices xmlns:u="urn:schemas-upnp-org:service:MusicServices:1"></u:ListAvailableServices>'
};

const SONOSSoapURLs = {
	SetEQ: '/MediaRenderer/RenderingControl/Control',
	Play: '/MediaRenderer/AVTransport/Control',
	Pause: '/MediaRenderer/AVTransport/Control',
	Stop: '/MediaRenderer/AVTransport/Control',
	Next: '/MediaRenderer/AVTransport/Control',
	Previous: '/MediaRenderer/AVTransport/Control',
	Mute: '/MediaRenderer/RenderingControl/Control',
	GroupMute: '/MediaRenderer/GroupRenderingControl/Control',
	Volume: '/MediaRenderer/RenderingControl/Control',
	Seek: '/MediaRenderer/AVTransport/Control',
	RemoveAllTracksFromQueue: '/MediaRenderer/AVTransport/Control',
	RemoveTrackFromQueue: '/MediaRenderer/AVTransport/Control',
	RemoveTrackRangeFromQueue: '/MediaRenderer/AVTransport/Control',
	ReorderTracksInQueue: '/MediaRenderer/AVTransport/Control',
	SaveQueue: '/MediaRenderer/AVTransport/Control',
	SetPlayMode: '/MediaRenderer/AVTransport/Control',
	SetCrossfadeMode: '/MediaRenderer/AVTransport/Control',
	GetPositionInfo: '/MediaRenderer/AVTransport/Control',
	ConfigureSleepTimer: '/MediaRenderer/AVTransport/Control',
	SetAVTransportURI: '/MediaRenderer/AVTransport/Control',
	Browse: '/MediaRenderer/ContentDirectory/Control',
	BecomeCoordinatorOfStandaloneGroup: '/MediaRenderer/AVTransport/Control',
	RefreshShareIndex: '/MediaRenderer/ContentDirectory/Control',
	AddURIToQueue: '/MediaRenderer/AVTransport/Control',
	AddMultipleURIsToQueue: '/MediaRenderer/AVTransport/Control',
	ListAvailableServices: '/MediaRenderer/MusicServices/Control'
};

@Injectable()
export class SONOSService {

	private _settings: any;
	private _panelItems = [
		{
			nicename: 'Sonos Zone Controller',
			uniquename: 'sonos-zonecontroller',
			homeyservice: 'sonos',
			homeyactions: [],
			homeydata: [
				{
					nicename: 'Full Sonos State',
					uniquename: 'sonos-zonestate',
					payload: {} // fill it with the full data point
				}
			] // will be filled with GPS location Geoposition (or something a like)
		}
	];

	private _actions = [];

	constructor(
		private http: Http,
		private HomeyDOM: HomeyDOMData
	) { };


	// Init service is called when the app is started
	// this should register all available items to the app (panelitems, conditions, data, actions, and the service itself)
	initService() {
		this.HomeyDOM.registerService({ nicename: 'Sonos Home System', uniquename: 'sonos' });
		this.HomeyDOM.registerPanelItems(this._panelItems);
		this.HomeyDOM.registerActions(this._actions);

		// try to get the settings
		this._settings = defaultSettings;
		this._settings = this.HomeyDOM.getHomeyDOMNode('sonos-settings');
		if (this._settings == {}) this._settings = defaultSettings;
	}

	// Call Api is called by the app to execute an action as earlier registered
	// by the service. The payload has the data needed for each specific API call
	callAPI(payload: HomeyAction) {
		let SOAPbody = SONOSSOAPTemplates[payload['sonosaction']];
		let SOAPaction = SONOSSoapActions[payload['sonosaction']];
		let SOAPurl = 'http://' + payload['sonosaction']['ipport'] + SONOSSoapURLs[payload['sonosaction']];

		// do a search-replace of all the update data available and then do the HTTP request
		for (var key in payload['updatedata'])
			SOAPbody = SOAPbody.replace(key, payload['updatedata'][key]); // should do this until all occurences as gone, TODO
		console.log('SOAPbody', + SOAPbody);

		// here the full SOAP call
		let headers = new Headers({ 'Content-Type': 'text/xml' });
		headers.append('SOAPACTION', SOAPaction);
		headers.append('CONTENT-LENGTH', SOAPbody.length);
		headers.append('type', 'stream');

		return this.http.post(SOAPurl, SOAPbody, { headers: headers })
			.map(res => {
				xml2js.parseString(res, (err, result) => {
					return result;
				})
			})

			// need to add a .map to translate XML to JSON and return to caller
			// uitzoeken
			// 		xml2js.parseString(soapBody, function(err, result) {
			//	console.log('asdasds', result);
			//});
			.subscribe(result => {
				console.log('SONOS', result);
			}, error => { console.log('SONOS error', error); });
	}

	// refreshes all dataitems for this service
	refreshAllData() {

		// get full Topology

		// get full State 


		let url = this._settings.Protocol +
			this._settings.Server + ':' +
			this._settings.Port +
			'/json.htm?type=devices&used=true&order=Name';

		// need to do a return on the response 
		this.http.get(url)
			.map(res => res.json())
			// to check: what happens if the server is down or gives an error
			.flatMap(res => res['result'])
			.subscribe(item => {
				// do actions per found item

				// find the last IDX, and if new, let DomeyData know


				// per found device
				// 1. register panelitem



				console.log("Found item", item);
			}, error => console.log('Could not load devices'));

		//console.log('response', response);
	}

	// refresh data of one HomeyData item
	refreshData(item) {
		// we refresh all because in one go we can get everything very easily
		// resource intensive, so a TODO
		this.refreshAllData();
	}

	discoverSonos() {

		let PORT = 1900;
		let topology: string = '';

		// for all IPs available in the settings (earlier found), we try to do a 
		// topology search to find SONOS zones
//		this._settings.SONOSIPs.map((IP) => {
//			this._trySONOStopology(IP)
//				.subscribe(result => {});//topology = result.toString);
//		});
	

		// convert string to ArrayBuffer - taken from Chrome Developer page
		function str2ab(str) {
			var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
			var bufView = new Uint16Array(buf);
			for (var i = 0, strLen = str.length; i < strLen; i++) {
				bufView[i] = str.charCodeAt(i);
			}
			return buf;
		}

		// register the listeners
		// TODO: unregister the listeners
		chrome.sockets.udp.onReceive.addListener(
			(info) => {
				// we have found one 
				console.log('Recv from socket: ', info);
				this._settings.SONOSIPs.push({ items: info.ipadress });
				chrome.sockets.udp.close(info.socketId);
			}
		);

		chrome.sockets.udp.onReceiveError.addListener(
			(error) => {
				console.log('Recv  ERROR from socket: ', error);
				chrome.sockets.udp.close(error.socketId);
			}
		);

		// UPNP string to search for SONOS
		let SONOS_SEARCHSTRING = 'M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: ssdp:discover\r\nMX: 1\r\nST: urn:schemas-upnp-org:device:ZonePlayer:1';

		// translate the string into ArrayBuffer
		let UPNPSTRING = str2ab(SONOS_SEARCHSTRING);

		// send  the UDP search as captures in UPNPSTRING and to port PORT
		chrome.sockets.udp.create((createInfo) => {
			chrome.sockets.udp.bind(createInfo.socketId, '0.0.0.0', PORT, (bindresult) => {
				chrome.sockets.udp.setMulticastTimeToLive(createInfo.socketId, 2, (ttlresult) => {
					chrome.sockets.udp.setBroadcast(createInfo.socketId, true, function(sbresult) {
						chrome.sockets.udp.send(createInfo.socketId, UPNPSTRING, '239.255.255.250', PORT, (sendresult) => {
							if (sendresult < 0) {
								console.log('send fail: ' + sendresult);
								//this.debugInfo = this.debugInfo + ' f1' + JSON.stringify(sendresult);
								//chrome.sockets.udp.close(createInfo.socketId);
							} else {
								console.log('sendTo: success ' + PORT, createInfo, bindresult, ttlresult, sbresult, sendresult);
								//this.debugInfo = this.debugInfo + ' f2' + JSON.stringify(PORT);
								//	chrome.sockets.udp.close(createInfo.socketId);
							}
						});
					});
				});
			});
		});
	}

	_trySONOStopology(IP) {

	}
}

	/*
				`
	M-SEARCH * HTTP/1.1
	HOST: 239.255.255.250:reservedSSDPport
	MAN: ssdp:discover
	MX: 1
	ST: urn:schemas-upnp-org:device:ZonePlayer:1
				 `);
	
	*/




/*
		
		Device description:	http://192.168.178.19:1400/xml/device_description.xml
		Topology : 192.168.178.19:1400/status/topology


		HUE discovery: https://www.meethue.com/api/nupnp
		
		{
			 "id":"001788fffe100491",
			 "internalipaddress":"192.168.2.23",
			 "macaddress":"00:17:88:10:04:91",
			 "name":"Philips Hue"
		}
		
		UPNPN:
		
		 https://developers.meethue.com/content/upnp-scanning-philips-hue-bridge  (in google cache discussion forum)
		M-SEARCH * HTTP/1.1
		ST: ssdp:all
		MX: 3
		MAN: ssdp:discover
		HOST: 239.255.255.250:1900
		
		
		response:
		
		HTTP/1.1 200 OK
		HOST: 239.255.255.250:1900
		EXT:CACHE-CONTROL: max-age=100
		LOCATION: http://192.168.xxx.xxx:80/description.xml
		SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.16.0
		hue-bridgeid: 001788FFFE29D301
		ST: urn:schemas-upnp-org:device:basic:1
		USN: uuid:2f402f80-da50-11e1-9b23-00178829d301
//		let UPNPALL_SEARCHSTRING = "M-SEARCH * HTTP/1.1\r\nHost: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 5\r\nST: ssdp:all\r\n\r\n";
//		let UPNPROOTDEVICE_SEARCHSTRING = "M-SEARCH * HTTP/1.1\r\nHost: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 5\r\nST: upnp:rootdevice\r\n\r\n";

		
		*/
