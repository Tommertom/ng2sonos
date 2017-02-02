import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/Rx";
import { Http, Headers } from '@angular/http';

import { UDPService } from './udp.provider';

// package install 
//npm install xml2js --save
//npm install -g typings
//typings install dt~xml2js --save
import * as xml2js from "xml2js"

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

	private topology: Object = {};
	private topologyList: Array<string> = [];
	private sonosIPs: Array<string> = [];
	private doRefresh: boolean = false;
	private searchAttempt: number = 0;
	private sonoszones: BehaviorSubject<Object> = new BehaviorSubject({});
	private sonoscoordinators: BehaviorSubject<Object> = new BehaviorSubject({});
	private plans: BehaviorSubject<Object> = new BehaviorSubject({});

	constructor(
		private UDPService: UDPService,
		private http: Http,
	) { };

	// Init service is called when the app is started
	// this should register all available items to the app (panelitems, conditions, data, actions, and the service itself)
	initService(sonosIPs: Array<string>) {
		// try to find topology through IPs given
		this.topologyList = [];
		this.topology = {};

		//console.log('adsdas', sonosIPs);
		sonosIPs.map(ip => {
			//	console.log('adsIPdas', ip, this.topology, this.topology === {});
			// if no topology was found until then, try to find
			if (this.topologyList.length == 0) {
				this.getTopology(ip)
					.subscribe(
					(tplgy) => {
						xml2js.parseString(tplgy, (err, result) => {
							console.log('ttt', result);

							// search through the xml result tree for the array of zones
							let itemlist = <Array<Object>>result['ZPSupportInfo']['ZonePlayers'][0]['ZonePlayer'];

							this.searchAttempt = 5;

							itemlist.map(item => {
								//console.log('item', this.topology, this.topologyList);

								let location = <string>item['$']['location'];
								location = location.replace('http://', '');
								location = location.replace(':1400/xml/device_description.xml', '');

								if (this.topologyList.indexOf(location) < 0) {
									this.topologyList.push(location);
									this.topology[location] = item['$'];
									this.topology[location]['roomname'] = item['_'];
									this.topology[location]['ip'] = location;
								}
							});

							console.log('Topology object', this.topologyList, this.topology);
						});


					},
					(error) => {
						if (this.searchAttempt < 4) {
							this.searchAttempt += 1;
							this.discoverSonos();
						}
					}
					);
			}
		});
		// and if that doesn't work, try UDP discovery
	}

	discoverSonos() {
		//this.UDPService.sendUDPMessage();
		//this.discoverSonos();
	}

	getSonosZoneObservable() {
		return this.sonoszones.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
	}

	getSonosCoordinatorObservable() {
		return this.sonoscoordinators.asObservable().skip(1); // hack? need to skip the first item emitted due to the creation
	}


	private getTopology(ip: string) {
		let SOAPurl = 'http://' + ip + ':1400/status/topology';

		//	console.log("sdsda", SOAPurl);

		return this.http.get(SOAPurl)
			//.map(res => res.json())
			.map(res => res.text())
		//.flatMap(res=> { return Observable.fromPromise(xml2js.parseString(res))})
		//.mergeMap(res => xml2js.parseString(res));
		/*

		 .flatMap(res=>{
					return Observable.fromPromise(this.getJSON(res.text()))
			})
		{
			console.log('Get topssssoology', res, res.text());
			xml2js.parseString(res.text(), (err, result) => {
				console.log('saasas', result);
				return result;
			})
		});
		*/
	}

	// 
	private callAPI(sonosaction, sonosip, payload) {
		let SOAPbody = SONOSSOAPTemplates[sonosaction];
		let SOAPaction = SONOSSoapActions[sonosaction];
		let SOAPurl = 'http://' + sonosip + ':1400' + SONOSSoapURLs[sonosaction];

		// do a search-replace of all the update data available and then do the HTTP request
		for (var key in payload)
			SOAPbody = SOAPbody.replace(key, payload[key]); // should do this until all occurences as gone, TODO
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
			});
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


//http://192.168.178.43:1400/xml/device_description.xml
	
	This XML file does not appear to have any style information associated with it. The document tree is shown below.
<root xmlns="urn:schemas-upnp-org:device-1-0">
<specVersion>
<major>1</major>
<minor>0</minor>
</specVersion>
<device>
<deviceType>urn:schemas-upnp-org:device:ZonePlayer:1</deviceType>
<friendlyName>192.168.178.43 - Sonos PLAY:1</friendlyName>
<manufacturer>Sonos, Inc.</manufacturer>
<manufacturerURL>http://www.sonos.com</manufacturerURL>
<modelNumber>S12</modelNumber>
<modelDescription>Sonos PLAY:1</modelDescription>
<modelName>Sonos PLAY:1</modelName>
<modelURL>http://www.sonos.com/products/zoneplayers/S12</modelURL>
<softwareVersion>34.16-37101</softwareVersion>
<hardwareVersion>1.20.1.6-2</hardwareVersion>
<serialNum>9AKDLKSDSLKAJ</serialNum>
<UDN>uuid:RINCON_9asdasdsadsds0</UDN>
<iconList>
<icon>
<id>0</id>
<mimetype>image/png</mimetype>
<width>48</width>
<height>48</height>
<depth>24</depth>
<url>/img/icon-S12.png</url>
</icon>
</iconList>
<minCompatibleVersion>33.0-00000</minCompatibleVersion>
<legacyCompatibleVersion>25.0-00000</legacyCompatibleVersion>
<displayVersion>7.1</displayVersion>
<extraVersion/>
<roomName>asdasdsaze</roomName>
<displayName>PLAY:1</displayName>
<zoneType>14</zoneType>
<feature1>0x00000000</feature1>
<feature2>0x00403332</feature2>
<feature3>0x0001000e</feature3>
<variant>1</variant>
<internalSpeakerSize>5</internalSpeakerSize>
<bassExtension>75.000</bassExtension>
<satGainOffset>6.000</satGainOffset>
<memory>256</memory>
<flash>256</flash>
<ampOnTime>10</ampOnTime>
<serviceList>
<service>
<serviceType>urn:schemas-upnp-org:service:AlarmClock:1</serviceType>
<serviceId>urn:upnp-org:serviceId:AlarmClock</serviceId>
<controlURL>/AlarmClock/Control</controlURL>
<eventSubURL>/AlarmClock/Event</eventSubURL>
<SCPDURL>/xml/AlarmClock1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:MusicServices:1</serviceType>
<serviceId>urn:upnp-org:serviceId:MusicServices</serviceId>
<controlURL>/MusicServices/Control</controlURL>
<eventSubURL>/MusicServices/Event</eventSubURL>
<SCPDURL>/xml/MusicServices1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:DeviceProperties:1</serviceType>
<serviceId>urn:upnp-org:serviceId:DeviceProperties</serviceId>
<controlURL>/DeviceProperties/Control</controlURL>
<eventSubURL>/DeviceProperties/Event</eventSubURL>
<SCPDURL>/xml/DeviceProperties1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:SystemProperties:1</serviceType>
<serviceId>urn:upnp-org:serviceId:SystemProperties</serviceId>
<controlURL>/SystemProperties/Control</controlURL>
<eventSubURL>/SystemProperties/Event</eventSubURL>
<SCPDURL>/xml/SystemProperties1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:ZoneGroupTopology:1</serviceType>
<serviceId>urn:upnp-org:serviceId:ZoneGroupTopology</serviceId>
<controlURL>/ZoneGroupTopology/Control</controlURL>
<eventSubURL>/ZoneGroupTopology/Event</eventSubURL>
<SCPDURL>/xml/ZoneGroupTopology1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:GroupManagement:1</serviceType>
<serviceId>urn:upnp-org:serviceId:GroupManagement</serviceId>
<controlURL>/GroupManagement/Control</controlURL>
<eventSubURL>/GroupManagement/Event</eventSubURL>
<SCPDURL>/xml/GroupManagement1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-tencent-com:service:QPlay:1</serviceType>
<serviceId>urn:tencent-com:serviceId:QPlay</serviceId>
<controlURL>/QPlay/Control</controlURL>
<eventSubURL>/QPlay/Event</eventSubURL>
<SCPDURL>/xml/QPlay1.xml</SCPDURL>
</service>
</serviceList>
<deviceList>
<device>
<deviceType>urn:schemas-upnp-org:device:MediaServer:1</deviceType>
<friendlyName>192.168.178.43 - Sonos PLAY:1 Media Server</friendlyName>
<manufacturer>Sonos, Inc.</manufacturer>
<manufacturerURL>http://www.sonos.com</manufacturerURL>
<modelNumber>S12</modelNumber>
<modelDescription>Sonos PLAY:1 Media Server</modelDescription>
<modelName>Sonos PLAY:1</modelName>
<modelURL>http://www.sonos.com/products/zoneplayers/S12</modelURL>
<UDN>uuid:RINCON_94fasadasdsa00_MS</UDN>
<serviceList>
<service>
<serviceType>urn:schemas-upnp-org:service:ContentDirectory:1</serviceType>
<serviceId>urn:upnp-org:serviceId:ContentDirectory</serviceId>
<controlURL>/MediaServer/ContentDirectory/Control</controlURL>
<eventSubURL>/MediaServer/ContentDirectory/Event</eventSubURL>
<SCPDURL>/xml/ContentDirectory1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType>
<serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId>
<controlURL>/MediaServer/ConnectionManager/Control</controlURL>
<eventSubURL>/MediaServer/ConnectionManager/Event</eventSubURL>
<SCPDURL>/xml/ConnectionManager1.xml</SCPDURL>
</service>
</serviceList>
</device>
<device>
<deviceType>urn:schemas-upnp-org:device:MediaRenderer:1</deviceType>
<friendlyName>Suze - Sonos PLAY:1 Media Renderer</friendlyName>
<manufacturer>Sonos, Inc.</manufacturer>
<manufacturerURL>http://www.sonos.com</manufacturerURL>
<modelNumber>S12</modelNumber>
<modelDescription>Sonos PLAY:1 Media Renderer</modelDescription>
<modelName>Sonos PLAY:1</modelName>
<modelURL>http://www.sonos.com/products/zoneplayers/S12</modelURL>
<UDN>uuid:RINCON_949asdasdsadsdas_MR</UDN>
<serviceList>
<service>
<serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>
<serviceId>urn:upnp-org:serviceId:RenderingControl</serviceId>
<controlURL>/MediaRenderer/RenderingControl/Control</controlURL>
<eventSubURL>/MediaRenderer/RenderingControl/Event</eventSubURL>
<SCPDURL>/xml/RenderingControl1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType>
<serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId>
<controlURL>/MediaRenderer/ConnectionManager/Control</controlURL>
<eventSubURL>/MediaRenderer/ConnectionManager/Event</eventSubURL>
<SCPDURL>/xml/ConnectionManager1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType>
<serviceId>urn:upnp-org:serviceId:AVTransport</serviceId>
<controlURL>/MediaRenderer/AVTransport/Control</controlURL>
<eventSubURL>/MediaRenderer/AVTransport/Event</eventSubURL>
<SCPDURL>/xml/AVTransport1.xml</SCPDURL>
</service>
<service>
<serviceType>urn:schemas-sonos-com:service:Queue:1</serviceType>
<serviceId>urn:sonos-com:serviceId:Queue</serviceId>
<controlURL>/MediaRenderer/Queue/Control</controlURL>
<eventSubURL>/MediaRenderer/Queue/Event</eventSubURL>
<SCPDURL>/xml/Queue1.xml</SCPDURL>
</service>
<service>
<serviceType>
urn:schemas-upnp-org:service:GroupRenderingControl:1
</serviceType>
<serviceId>urn:upnp-org:serviceId:GroupRenderingControl</serviceId>
<controlURL>/MediaRenderer/GroupRenderingControl/Control</controlURL>
<eventSubURL>/MediaRenderer/GroupRenderingControl/Event</eventSubURL>
<SCPDURL>/xml/GroupRenderingControl1.xml</SCPDURL>
</service>
</serviceList>
<X_Rhapsody-Extension xmlns="http://www.real.com/rhapsody/xmlns/upnp-1-0">
<deviceID>
urn:rhapsody-real-com:device-id-1-0:sonos_1:RINCON_949sdasdsdasdas
</deviceID>
<deviceCapabilities>
<interactionPattern type="real-rhapsody-upnp-1-0"/>
</deviceCapabilities>
</X_Rhapsody-Extension>
<qq:X_QPlay_SoftwareCapability xmlns:qq="http://www.tencent.com">QPlay:2</qq:X_QPlay_SoftwareCapability>
<iconList>
<icon>
<mimetype>image/png</mimetype>
<width>48</width>
<height>48</height>
<depth>24</depth>
<url>/img/icon-S12.png</url>
</icon>
</iconList>
</device>
</deviceList>
</device>
</root>


		*/
