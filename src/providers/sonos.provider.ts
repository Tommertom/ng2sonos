import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/Rx";
import { Http, Headers, RequestOptions, RequestMethod } from '@angular/http';

/*
Object.assign({}, obj1, obj2, obj3, etc);

*/

import { UDPService } from './udp.provider';

export interface SonosSettingsModel {
	sonosIPs: Array<string>;    // IP adress of sonos zones known
	refreshdelayTopology: number;       // the ms to wait before a full refresh
	refreshdelayState: number;       // the ms to wait before a full refresh
}

//npm install --save pixl-xml
import * as XML from 'pixl-xml';

// taken from https://github.com/jishi/node-sonos-http-api
// and https://github.com/bencevans/node-sonos.git 

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
	ListAvailableServices: 'urn:schemas-upnp-org:service:MusicServices:1#ListAvailableServices',

	// below from BenCEvans
	GetZoneInfo: 'urn:schemas-upnp-org:service:DeviceProperties:1#GetZoneInfo',
	GetVolume: 'urn:schemas-upnp-org:service:RenderingControl:1#GetVolume',
	GetZoneAttributes: 'urn:schemas-upnp-org:service:DeviceProperties:1#GetZoneAttributes',
	GetTransportInfo: 'urn:schemas-upnp-org:service:AVTransport:1#GetTransportInfo'
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
	ListAvailableServices: '<u:ListAvailableServices xmlns:u="urn:schemas-upnp-org:service:MusicServices:1"></u:ListAvailableServices>',

	// From BenCEvans
	GetTransportInfo: '<u:GetTransportInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:GetTransportInfo>',
	GetZoneInfo: '<u:GetZoneInfo xmlns:u="urn:schemas-upnp-org:service:DeviceProperties:1"></u:GetZoneInfo>',
	GetZoneAttributes: '<u:GetZoneAttributes xmlns:u="urn:schemas-upnp-org:service:DeviceProperties:1"></u:GetZoneAttributes>',
	GetVolume: '<u:GetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetVolume>'
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
	ListAvailableServices: '/MediaRenderer/MusicServices/Control',

	// From BenCEvans
	GetTransportInfo: '/MediaRenderer/AVTransport/Control',
	GetZoneInfo: '/DeviceProperties/Control',
	GetZoneAttributes: '/DeviceProperties/Control',
	GetVolume: '/MediaRenderer/AVTransport/Control'
};

@Injectable()
export class SONOSService {

	private topology: Object = {};
	private state: Object = {};
	private topologyList: Array<string> = [];

	private sonosIPs: Array<string> = [];
	private doRefresh: boolean = false;
	private refreshdelay: number = 1000;

	private sonoszones: BehaviorSubject<Object> = new BehaviorSubject({});
	private sonoscoordinators: BehaviorSubject<Object> = new BehaviorSubject({});
	private sonosstates: BehaviorSubject<Object> = new BehaviorSubject({});

	constructor(
		private UDPService: UDPService,
		private http: Http
	) { };

	// Init service is called when the app is started
	initService(sonosIPs: Array<string>) {

		// start from scratch
		this.topologyList = [];
		this.topology = {}; //
		this.state = {};
		this.doRefresh = true;

		// we are going to do IP based search and UDP search at the same time, whatever yields results will be used
		if (sonosIPs.length > 0) this.discoverSonosIP(sonosIPs);

		// start UDP discovery anyway and if IP is found, try to find topology on it, doubling the effort
		// THIS DOES NOT WORK IN IONIC VIEW
		//this.discoverSonosUDP();

		// start emitting whatever we have
		this.repeatSonosRefresh();
	}


	repeatSonosRefresh() {
		// refresh all observables
		this.refreshSonos();

		//and repeat yourself if needed
		if (this.doRefresh)
			setTimeout(() => {
				this.repeatSonosRefresh()
			}, this.refreshdelay);
	}

	refreshSonos() {
		this.emitAllZones();
		//this.emitAllCoordinators();
		this.emitAllStates();
	}


	//
	// Setters
	//
	setEQ(eqType, value, IP) {
		return this.callAPI('SetEQ', IP, { '{value}': value });
	}

	playSonos(IP) {
		return this.callAPI('Play', IP, {});
	}

	pauseSonos(IP) {
	}

	stopSonos(IP) {
	}

	nextSonos(IP) {
	}

	previousSonos(IP) {
	}

	muteSonos(mute, IP) {
	}


	volumeSonos(volume, IP) {
		return this.callAPI('Volume', IP, { '{volume}': volume })
	}

	//
	// Getters
	//
	getTransportInfo(IP) {
		return this.callAPI('GetTransportInfo', IP, {})
	}

	getZoneInfo(IP) {
		return this.callAPI('GetZoneInfo', IP, {})
	}

	getZoneAttributes(IP) {
		return this.callAPI('GetZoneAttributes', IP, {})
	}

	getPositionInfo(IP) {
		return this.callAPI('GetPositionInfo', IP, {})
	}

	getZoneVolume(IP) {
		return this.callAPI('GetVolume', IP, {})
	}

	// '<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1"><ObjectID>{objectId}</ObjectID>
	//  <BrowseFlag>BrowseDirectChildren</BrowseFlag><Filter /><StartingIndex>{startIndex}</StartingIndex>
	// <RequestedCount>{limit}</RequestedCount><SortCriteria /></u:Browse>',
	//
	getRadio(IP, searchType, searchTerm, options, callback) {
		let radioTypes = {
			'stations': 'R:0/0',
			'shows': 'R:0/1'
		}

		let defaultOptions = {
			BrowseFlag: 'BrowseDirectChildren',
			Filter: '*',
			StartingIndex: '0',
			RequestedCount: '100',
			SortCriteria: '',
			ObjectID: 'R:0/0'
		}

		return this.callAPI('Browse', IP, {
			'{objectId}': radioTypes[searchType],
			'{startIndex}': '0',
			'{limit}': '100',
		})
	}

	// 
	private callAPI(sonosaction, sonosip, payload) {
		let SOAPbody: string = SONOSSOAPTemplates[sonosaction];
		let SOAPaction: string = SONOSSoapActions[sonosaction];
		let SOAPurl: string = 'http://' + sonosip + ':1400' + SONOSSoapURLs[sonosaction];

		// do a search-replace of all the update data available and then do the HTTP request
		for (var key in payload)
			SOAPbody = SOAPbody.replace(key, payload[key]); // should do this until all occurences as gone, TODO

		// add the preface and closing tags
		SOAPbody = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>`
			+ SOAPbody + `</s:Body></s:Envelope>`;

		// here the full SOAP call
		let headers = new Headers({ 'Content-Type': 'text/xml' });
		headers.append('SOAPACTION', SOAPaction);
		//headers.append('CONTENT-LENGTH', SOAPbody.length.toString());
		headers.append('type', 'stream');

		return this.http.post(SOAPurl, SOAPbody, { headers: headers })
			.map(res => XML.parse(XML.decodeEntities(res.text())))
	}

	private emitAllZones() {
		this.topologyList.map(ip => {
			if (typeof this.topology[ip] !== 'undefined') {
				this.sonoszones.next(this.topology[ip]);
			}
		});
	}

	// change into filter on Zones
	private emitAllCoordinators() {
		/*	this.topologyList.map(ip => {
				if (typeof this.topology[ip] !== 'undefined') {
					if (this.topology[ip]['coordinator'] == "true")
						this.sonoscoordinators.next(this.topology[ip]);
				}
	
			}); */ // No longer needed as we filter the zone output and redirect
	}

	// for all zones found, emit the state as captured in a number of calls (tbd)
	private emitAllStates() {
		this.topologyList.map(ip => {
			this.getPositionInfo(ip)
				.subscribe(posinfo => {
					this.state[ip] = posinfo['s:Body']['u:GetPositionInfoResponse'];

					// and clean the object a bit
					this.state[ip]['TrackMetaData'] = posinfo['s:Body']['u:GetPositionInfoResponse']['TrackMetaData']['DIDL-Lite']['item'];
					delete this.state[ip]['TrackMetaData']['DIDL-Lite'];

					this.state[ip]['ip'] = ip;

					//console.log('statesender', this.state);
					this.sonosstates.next(this.state[ip]);
				});
		});
	}

	doneSonosService() {
		// stop pulling data
		this.doRefresh = false;

		// and finish the streams
		this.sonoscoordinators.complete();
		this.sonoszones.complete();
		this.sonosstates.complete();
	}

	getSonosZoneObservable() {
		return this.sonoszones.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
	}

	getSonosCoordinatorObservable() {
		return this.getSonosZoneObservable().filter(res => res['coordinator'] == "true");
	}

	getSonosStateObservable() {
		return this.sonosstates.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
	}

	private discoverSonosIP(sonosIPs: Array<string>) {

		//console.log('adsdas', sonosIPs);
		sonosIPs.map(ip => {

			// if no topology was found until then, try to find
			if (this.topologyList.length == 0) {
				this.getTopology(ip)
					.subscribe(
					(tplgy) => {
						let result = XML.parse(XML.decodeEntities(tplgy));

						//console.log('Result Topology', result);

						// search through the xml result tree for the array of zones
						let itemlist = <Array<Object>>result['ZonePlayers']['ZonePlayer'];

						// lets go through all the Zoneplayers found through the endpoint
						itemlist.map(item => {

							//console.log('item', this.topology, this.topologyList);
							let location = <string>item['location'];
							location = location.replace('http://', '');
							location = location.replace(':1400/xml/device_description.xml', '');

							// enrich the object to be store for later usage, if found
							if (this.topologyList.indexOf(location) < 0) {
								// add it to the list
								this.topologyList.push(location);

								// add data to overall store
								this.topology[location] = item;
								this.topology[location]['roomname'] = item['_Data'];

								// add some fields
								this.topology[location]['ip'] = location;

								// and get some more device related data
								this.getDeviceDescription(location)
									.subscribe(value => {
										let result = XML.parse(value);
										//console.log('GET DEVICE DESC', result)
										this.topology[location]['device_description'] = result['device'];
									});
							} // end if
						}); // end map
					},
					(error) => {
						console.log('Error checking topology');
					}
					);
			} // end if
		}); // end map
	}

	private discoverSonosUDP() {
		// search data
		let SONOS_SEARCHSTRING = 'M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: ssdp:discover\r\nMX: 1\r\nST: urn:schemas-upnp-org:device:ZonePlayer:1';
		let PORT = 1900;
		let multicastaddresses = ['239.255.255.250', '255.255.255.255'];

		///sendUDPMessage(message: string, port: number, addresses: Array<string>, ttl: number, timetolisten: number) {
		this.UDPService.sendUDPMessage(SONOS_SEARCHSTRING, PORT, multicastaddresses, 2, 5000)
			.subscribe(value => {
				console.log('recevied udp data', value);

				// if data is received, then it contains an IP which can be used to find topology
				if (typeof value['error'] === 'undefined')
					this.discoverSonosIP([<string>value['ip']]);
			});
	}

	private getTopology(ip: string) {
		return this.http.get('http://' + ip + ':1400/status/topology')
			.map(res => res.text())
	}

	private getDeviceDescription(ip: string) {
		return this.http.get('http://' + ip + ':1400/xml/device_description.xml')
			.map(res => res.text())
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
