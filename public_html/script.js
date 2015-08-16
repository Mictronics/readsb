// -*- mode: javascript; indent-tabs-mode: nil; c-basic-offset: 8 -*-
"use strict";

// Define our global variables
var GoogleMap     = null;
var Planes        = {};
var PlanesOrdered = [];
var SelectedPlane = null;
var FollowSelected = false;

var SpecialSquawks = {
        '7500' : { cssClass: 'squawk7500', markerColor: 'rgb(255, 85, 85)', text: 'Aircraft Hijacking' },
        '7600' : { cssClass: 'squawk7600', markerColor: 'rgb(0, 255, 255)', text: 'Radio Failure' },
        '7700' : { cssClass: 'squawk7700', markerColor: 'rgb(255, 255, 0)', text: 'General Emergency' }
};

// Get current map settings
var CenterLat, CenterLon, ZoomLvl;

var Dump1090Version = "unknown version";
var RefreshInterval = 1000;

var PlaneRowTemplate = null;

var TrackedAircraft = 0;
var TrackedAircraftPositions = 0;
var TrackedHistorySize = 0;

var SitePosition = null;

var ReceiverClock = null;

var LastReceiverTimestamp = 0;
var StaleReceiverCount = 0;
var FetchPending = null;

var MessageCountHistory = [];
var MessageRate = 0;

var NBSP='\u00a0';

var Icao_Codes = [[7340032,7344128,"Afghanistan"],[5246976,5248000,"Albania"],[655360,688128,"Algeria"],[589824,593920,"Angola"],[827392,828416,"Antigua_and_Barbuda"],[14680064,14942208,"Argentina"],[6291456,6292480,"Armenia"],[8126464,8388608,"Australia"],[4456448,4489216,"Austria"],[6293504,6294528,"Azerbaijan"],[688128,692224,"Bahamas"],[8994816,8998912,"Bahrain"],[7348224,7352320,"Bangladesh"],[696320,697344,"Barbados"],[5308416,5309440,"Belarus"],[4489216,4521984,"Belgium"],[700416,701440,"Belize"],[606208,607232,"Benin"],[4194432,4194751,"Bermuda"],[4341760,4342015,"Bermuda"],[6815744,6816768,"Bhutan"],[15286272,15290368,"Bolivia"],[5320704,5321728,"Bosnia"],[196608,197632,"Botswana"],[14942208,15204352,"Brazil"],[8998912,8999936,"Brunei"],[4521984,4554752,"Bulgaria"],[638976,643072,"Burkina_Faso"],[204800,208896,"Burundi"],[229376,233472,"Cote_d_Ivoire"],[7397376,7401472,"Cambodia"],[212992,217088,"Cameroon"],[12582912,12845056,"Canada"],[614400,615424,"Cape_Verde"],[442368,446464,"Central_African_Republic"],[540672,544768,"Chad"],[15204352,15208448,"Chile"],[7864320,8126464,"China"],[704512,708608,"Colombia"],[217088,218112,"Comoros"],[221184,225280,"Democratic_Republic_of_the_Congo"],[9441280,9442304,"Cook_Islands"],[712704,716800,"Costa_Rica"],[5250048,5251072,"Croatia"],[720896,724992,"Cuba"],[5013504,5014528,"Cyprus"],[4816896,4849664,"Czech_Republic"],[7471104,7503872,"South_Korea"],[573440,577536,"Democratic_Republic_of_the_Congo"],[4554752,4587520,"Denmark"],[622592,623616,"Djibouti"],[802816,806912,"Dominican_Republic"],[15220736,15224832,"Ecuador"],[65536,98304,"Egypt"],[729088,733184,"El_Salvador"],[270336,274432,"Equatorial_Guinea"],[2105344,2106368,"Eritrea"],[5312512,5313536,"Estonia"],[262144,266240,"Ethiopia"],[13139968,13144064,"Fiji"],[4587520,4620288,"Finland"],[3670016,3932160,"France"],[253952,258048,"Gabon"],[630784,634880,"Gambia"],[5324800,5325824,"Georgia"],[3932160,4194304,"Germany"],[278528,282624,"Ghana"],[4620288,4653056,"Greece"],[835584,836608,"Grenada"],[737280,741376,"Guatemala"],[286720,290816,"Guinea"],[294912,295936,"Guinea_Bissau"],[745472,749568,"Guyana"],[753664,757760,"Haiti"],[761856,765952,"Honduras"],[4653056,4685824,"Hungary"],[15728640,15761408,"ICAO"],[15765504,15766528,"ICAO"],[5029888,5033984,"Iceland"],[8388608,8650752,"India"],[9043968,9076736,"Indonesia"],[7536640,7569408,"Iran"],[7503872,7536640,"Iraq"],[5021696,5025792,"Ireland"],[7569408,7602176,"Israel"],[3145728,3407872,"Italy"],[778240,782336,"Jamaica"],[8650752,8912896,"Japan"],[7602176,7634944,"Jordan"],[6828032,6829056,"Kazakhstan"],[311296,315392,"Kenya"],[13164544,13165568,"Kiribati"],[7364608,7368704,"Kuwait"],[6295552,6296576,"Kyrgyzstan"],[7372800,7376896,"Laos"],[5254144,5255168,"Latvia"],[7634944,7667712,"Lebanon"],[303104,304128,"Lesotho"],[327680,331776,"Liberia"],[98304,131072,"Libya"],[5258240,5259264,"Lithuania"],[5046272,5047296,"Luxembourg"],[344064,348160,"Madagascar"],[360448,364544,"Malawi"],[7667712,7700480,"Malaysia"],[368640,369664,"Maldives"],[376832,380928,"Mali"],[5054464,5055488,"Malta"],[9437184,9438208,"Marshall_Islands"],[385024,386048,"Mauritania"],[393216,394240,"Mauritius"],[851968,884736,"Mexico"],[6819840,6820864,"Micronesia"],[5062656,5063680,"Monaco"],[6823936,6824960,"Mongolia"],[5332992,5334016,"Serbia_and_Montenegro"],[131072,163840,"Morocco"],[24576,28672,"Mozambique"],[7356416,7360512,"Myanmar"],[2101248,2102272,"Namibia"],[13148160,13149184,"Nauru"],[7380992,7385088,"Nepal"],[4718592,4751360,"Netherlands"],[13107200,13139968,"New_Zealand"],[786432,790528,"Nicaragua"],[401408,405504,"Niger"],[409600,413696,"Nigeria"],[4685824,4718592,"Norway"],[7389184,7390208,"Oman"],[7733248,7766016,"Pakistan"],[6832128,6833152,"Palau"],[794624,798720,"Panama"],[9011200,9015296,"Papua_New_Guinea"],[15237120,15241216,"Paraguay"],[15253504,15257600,"Peru"],[7700480,7733248,"Philippines"],[4751360,4784128,"Poland"],[4784128,4816896,"Portugal"],[434176,435200,"Qatar"],[7438336,7471104,"South_Korea"],[5262336,5263360,"Moldova"],[4849664,4882432,"Romania"],[1048576,2097152,"Russian_Federation"],[450560,454656,"Rwanda"],[13156352,13157376,"Saint_Lucia"],[770048,771072,"Saint_Vicent_and_the_Grenadines"],[9445376,9446400,"Samoa"],[5242880,5243904,"San_Marino"],[7405568,7438336,"Saudi_Arabia"],[458752,462848,"Senegal"],[475136,476160,"Seychelles"],[483328,484352,"Sierra_Leone"],[7766016,7798784,"Singapore"],[5266432,5267456,"Slovakia"],[5270528,5271552,"Slovenia"],[491520,495616,"Somalia"],[32768,65536,"South_Africa"],[3407872,3670016,"Spain"],[7798784,7831552,"Sri_Lanka"],[507904,512000,"Sudan"],[819200,823296,"Suriname"],[499712,500736,"Swaziland"],[4882432,4915200,"Sweden"],[4915200,4947968,"Switzerland"],[7831552,7864320,"Syria"],[9015296,9016320,"Taiwan"],[5328896,5329920,"Tajikistan"],[8912896,8945664,"Thailand"],[557056,561152,"Togo"],[13160448,13161472,"Tonga"],[811008,815104,"Trinidad_and_Tobago"],[163840,196608,"Tunisia"],[4947968,4980736,"Turkey"],[6297600,6298624,"Turkmenistan"],[425984,430080,"Uganda"],[5275648,5308416,"Ukraine"],[9003008,9007104,"UAE"],[4194304,4456448,"United_Kingdom"],[10485760,11534336,"United_States_of_America"],[15269888,15273984,"Uruguay"],[5274624,5275648,"Uzbekistan"],[13172736,13173760,"Vanuatu"],[884736,917504,"Venezuela"],[8945664,8978432,"Vietnam"],[8978432,8982528,"Yemen"],[4980736,5013504,"Yugoslavia"],[16384,17408,"Zimbabwe"]];

function processReceiverUpdate(data) {
	// Loop through all the planes in the data packet
        var now = data.now;
        var acs = data.aircraft;

        // Detect stats reset
        if (MessageCountHistory.length > 0 && MessageCountHistory[MessageCountHistory.length-1].messages > data.messages) {
                MessageCountHistory = [{'time' : MessageCountHistory[MessageCountHistory.length-1].time,
                                        'messages' : 0}];
        }

        // Note the message count in the history
        MessageCountHistory.push({ 'time' : now, 'messages' : data.messages});
        // .. and clean up any old values
        if ((now - MessageCountHistory[0].time) > 30)
                MessageCountHistory.shift();

	for (var j=0; j < acs.length; j++) {
                var ac = acs[j];
                var hex = ac.hex;
                var plane = null;
		
	// Start of flag lookup code
		var i,icao_dec = 0;
		var img = document.createElement('img');
		//var i;

		// Convert the hex to integer
		icao_dec = parseInt(hex,16);

		// Look up the country of registration from icao address in array
		for (i = 0; i < Icao_Codes.length; i++) {
			if (icao_dec > Icao_Codes[i][0] && icao_dec < Icao_Codes[i][1]) {
				img.src = escapeHtml(Icao_Codes[i][2]);
				img.title = Icao_Codes[i][2].replace(/_/g, ' ');
				img.style.margin = "1px 2px";
				img.style.cssFloat = "right";		
			}	
		}	

		// Do we already have this plane object in Planes?
		// If not make it.

		if (Planes[hex]) {
			plane = Planes[hex];
		} else {
			plane = new PlaneObject(hex);
                        plane.tr = PlaneRowTemplate.cloneNode(true);
                        if (hex[0] === '~') {
                                // Non-ICAO address
                                plane.tr.cells[0].textContent = hex.substring(1);
                                $(plane.tr).css('font-style', 'italic');
                        } else {
                                plane.tr.cells[0].textContent = hex;
                                //append the flag
				plane.tr.cells[0].appendChild(img);
                        }

                        plane.tr.addEventListener('click', selectPlaneByHex.bind(undefined,hex,false));
                        plane.tr.addEventListener('dblclick', selectPlaneByHex.bind(undefined,hex,true));
                        
                        Planes[hex] = plane;
                        PlanesOrdered.push(plane);
		}

		// Call the function update
		plane.updateData(now, ac);
	}
}

function fetchData() {
        if (FetchPending !== null && FetchPending.state() == 'pending') {
                // don't double up on fetches, let the last one resolve
                return;
        }

	FetchPending = $.ajax({ url: 'data/aircraft.json',
                                timeout: 5000,
                                cache: false,
                                dataType: 'json' });
        FetchPending.done(function(data) {
                var now = data.now;

                processReceiverUpdate(data);

                // update timestamps, visibility, history track for all planes - not only those updated
                for (var i = 0; i < PlanesOrdered.length; ++i) {
                        var plane = PlanesOrdered[i];
                        plane.updateTick(now, LastReceiverTimestamp);
                }
                
		refreshTableInfo();
		refreshSelected();
                
                if (ReceiverClock) {
                        var rcv = new Date(now * 1000);
                        ReceiverClock.render(rcv.getUTCHours(),rcv.getUTCMinutes(),rcv.getUTCSeconds());
                }

                // Check for stale receiver data
                if (LastReceiverTimestamp === now) {
                        StaleReceiverCount++;
                        if (StaleReceiverCount > 5) {
                                $("#update_error_detail").text("The data from dump1090 hasn't been updated in a while. Maybe dump1090 is no longer running?");
                                $("#update_error").css('display','block');
                        }
                } else { 
                        StaleReceiverCount = 0;
                        LastReceiverTimestamp = now;
                        $("#update_error").css('display','none');
                }
	});

        FetchPending.fail(function(jqxhr, status, error) {
                $("#update_error_detail").text("AJAX call failed (" + status + (error ? (": " + error) : "") + "). Maybe dump1090 is no longer running?");
                $("#update_error").css('display','block');
        });
}

var PositionHistorySize = 0;
function initialize() {
        // Set page basics
        document.title = PageName;
        $("#infoblock_name").text(PageName);

        PlaneRowTemplate = document.getElementById("plane_row_template");

        if (!ShowClocks) {
                $('#timestamps').css('display','none');
        } else {
                // Create the clocks.
		new CoolClock({
			canvasId:       "utcclock",
			skinId:         "classic",
			displayRadius:  40,
			showSecondHand: true,
			gmtOffset:      "0", // this has to be a string!
			showDigital:    false,
			logClock:       false,
			logClockRev:    false
		});

		ReceiverClock = new CoolClock({
			canvasId:       "receiverclock",
			skinId:         "classic",
			displayRadius:  40,
			showSecondHand: true,
			gmtOffset:      null,
			showDigital:    false,
			logClock:       false,
			logClockRev:    false
		});

                // disable ticking on the receiver clock, we will update it ourselves
                ReceiverClock.tick = (function(){})
        }

        $("#loader").removeClass("hidden");
        
        // Get receiver metadata, reconfigure using it, then continue
        // with initialization
        $.ajax({ url: 'data/receiver.json',
                 timeout: 5000,
                 cache: false,
                 dataType: 'json' })

                .done(function(data) {
                        if (typeof data.lat !== "undefined") {
                                SiteShow = true;
                                SiteLat = data.lat;
                                SiteLon = data.lon;
                                DefaultCenterLat = data.lat;
                                DefaultCenterLon = data.lon;
                        }
                        
                        Dump1090Version = data.version;
                        RefreshInterval = data.refresh;
                        PositionHistorySize = data.history;
                })

                .always(function() {
                        initialize_map();
                        start_load_history();
                });
}

var CurrentHistoryFetch = null;
var PositionHistoryBuffer = []
function start_load_history() {
        if (PositionHistorySize > 0) {
                $("#loader_progress").attr('max',PositionHistorySize);
                console.log("Starting to load history (" + PositionHistorySize + " items)");
                load_history_item(0);
        } else {
                end_load_history();
        }
}

function load_history_item(i) {
        if (i >= PositionHistorySize) {
                end_load_history();
                return;
        }

        console.log("Loading history #" + i);
        $("#loader_progress").attr('value',i);

        $.ajax({ url: 'data/history_' + i + '.json',
                 timeout: 5000,
                 cache: false,
                 dataType: 'json' })

                .done(function(data) {
                        PositionHistoryBuffer.push(data);
                        load_history_item(i+1);
                })

                .fail(function(jqxhr, status, error) {
                        // No more history
                        end_load_history();
                });
}

function end_load_history() {
        $("#loader").addClass("hidden");

        console.log("Done loading history");

        if (PositionHistoryBuffer.length > 0) {
                var now, last=0;

                // Sort history by timestamp
                console.log("Sorting history");
                PositionHistoryBuffer.sort(function(x,y) { return (x.now - y.now); });

                // Process history
                for (var h = 0; h < PositionHistoryBuffer.length; ++h) {
                        now = PositionHistoryBuffer[h].now;
                        console.log("Applying history " + h + "/" + PositionHistoryBuffer.length + " at: " + now);
                        processReceiverUpdate(PositionHistoryBuffer[h]);

                        // update track
                        console.log("Updating tracks at: " + now);
                        for (var i = 0; i < PlanesOrdered.length; ++i) {
                                var plane = PlanesOrdered[i];
                                plane.updateTrack((now - last) + 1);
                        }

                        last = now;
                }

                // Final pass to update all planes to their latest state
                console.log("Final history cleanup pass");
                for (var i = 0; i < PlanesOrdered.length; ++i) {
                        var plane = PlanesOrdered[i];
                        plane.updateTick(now);
                }

                LastReceiverTimestamp = last;
        }

        PositionHistoryBuffer = null;

        console.log("Completing init");

        refreshTableInfo();
        refreshSelected();
        reaper();

        // Setup our timer to poll from the server.
        window.setInterval(fetchData, RefreshInterval);
        window.setInterval(reaper, 60000);

        // And kick off one refresh immediately.
        fetchData();

}

// Initalizes the map and starts up our timers to call various functions
function initialize_map() {
        // Load stored map settings if present
        CenterLat = Number(localStorage['CenterLat']) || DefaultCenterLat;
        CenterLon = Number(localStorage['CenterLon']) || DefaultCenterLon;
        ZoomLvl = Number(localStorage['ZoomLvl']) || DefaultZoomLvl;

        // Set SitePosition, initialize sorting
        if (SiteShow && (typeof SiteLat !==  'undefined') && (typeof SiteLon !==  'undefined')) {
	        SitePosition = new google.maps.LatLng(SiteLat, SiteLon);
                sortByDistance();
        } else {
	        SitePosition = null;
                PlaneRowTemplate.cells[5].style.display = 'none'; // hide distance column
                document.getElementById("distance").style.display = 'none'; // hide distance header
                sortByAltitude();
        }

	// Make a list of all the available map IDs
	var mapTypeIds = [];
	for(var type in google.maps.MapTypeId) {
		mapTypeIds.push(google.maps.MapTypeId[type]);
	}
	// Push OSM on to the end
	mapTypeIds.push("OSM");
	mapTypeIds.push("dark_map");

	// Styled Map to outline airports and highways
	var styles = [
		{
			"featureType": "administrative",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "landscape",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "poi",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "road",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "transit",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "landscape",
			"stylers": [
				{ "visibility": "on" },
				{ "weight": 8 },
				{ "color": "#000000" }
			]
		},{
			"featureType": "water",
			"stylers": [
			{ "lightness": -74 }
			]
		},{
			"featureType": "transit.station.airport",
			"stylers": [
				{ "visibility": "on" },
				{ "weight": 8 },
				{ "invert_lightness": true },
				{ "lightness": 27 }
			]
		},{
			"featureType": "road.highway",
			"stylers": [
				{ "visibility": "simplified" },
				{ "invert_lightness": true },
				{ "gamma": 0.3 }
			]
		},{
			"featureType": "road",
			"elementType": "labels",
			"stylers": [
				{ "visibility": "off" }
			]
		}
	]

	// Add our styled map
	var styledMap = new google.maps.StyledMapType(styles, {name: "Dark Map"});

	// Define the Google Map
	var mapOptions = {
		center: new google.maps.LatLng(CenterLat, CenterLon),
		zoom: ZoomLvl,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: true,
		streetViewControl: false,
		mapTypeControlOptions: {
			mapTypeIds: mapTypeIds,
			position: google.maps.ControlPosition.TOP_LEFT,
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		}
	};

	GoogleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	//Define OSM map type pointing at the OpenStreetMap tile server
	GoogleMap.mapTypes.set("OSM", new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
			return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
		},
		tileSize: new google.maps.Size(256, 256),
		name: "OpenStreetMap",
		maxZoom: 18
	}));

	GoogleMap.mapTypes.set("dark_map", styledMap);
	
	// Listeners for newly created Map
        google.maps.event.addListener(GoogleMap, 'center_changed', function() {
                localStorage['CenterLat'] = GoogleMap.getCenter().lat();
                localStorage['CenterLon'] = GoogleMap.getCenter().lng();
                if (FollowSelected) {
                        // On manual navigation, disable follow
                        var selected = Planes[SelectedPlane];
                        if (Math.abs(GoogleMap.getCenter().lat() - selected.position.lat()) > 0.0001 &&
                            Math.abs(GoogleMap.getCenter().lng() - selected.position.lng()) > 0.0001) {
                                FollowSelected = false;
                                refreshSelected();
                        }
                }
        });
    
        google.maps.event.addListener(GoogleMap, 'zoom_changed', function() {
                localStorage['ZoomLvl']  = GoogleMap.getZoom();
        });
	
	// Add home marker if requested
	if (SitePosition) {
	    var markerImage = new google.maps.MarkerImage(
	        'http://maps.google.com/mapfiles/kml/pal4/icon57.png',
            new google.maps.Size(32, 32),   // Image size
            new google.maps.Point(0, 0),    // Origin point of image
            new google.maps.Point(16, 16)); // Position where marker should point 
	    var marker = new google.maps.Marker({
          position: SitePosition,
          map: GoogleMap,
          icon: markerImage,
          title: SiteName,
          zIndex: -99999
        });
        
        if (SiteCircles) {
            for (var i=0;i<SiteCirclesDistances.length;i++) {
              drawCircle(marker, SiteCirclesDistances[i]); // in meters
            }
        }
	}
}

// This looks for planes to reap out of the master Planes variable
function reaper() {
        //console.log("Reaping started..");

	// Look for planes where we have seen no messages for >300 seconds
        var newPlanes = [];
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                var plane = PlanesOrdered[i];
                if (plane.seen > 300) {
			// Reap it.                                
                        //console.log("Reaping " + plane.icao);
                        //console.log("parent " + plane.tr.parentNode);
                        plane.tr.parentNode.removeChild(plane.tr);
                        plane.tr = null;
			delete Planes[plane.icao];
                        plane.destroy();
		} else {
                        // Keep it.
                        newPlanes.push(plane);
		}
	};

        PlanesOrdered = newPlanes;
        refreshTableInfo();
        refreshSelected();
}

// Page Title update function
function refreshPageTitle() {
        if (!PlaneCountInTitle && !MessageRateInTitle)
                return;

        var subtitle = "";

        if (PlaneCountInTitle) {
                subtitle += TrackedAircraftPositions + '/' + TrackedAircraft;
        }

        if (MessageRateInTitle) {
                if (subtitle) subtitle += ' | ';
                subtitle += MessageRate.toFixed(1) + '/s';
        }

        document.title = PageName + ' - ' + subtitle;
}

// Refresh the detail window about the plane
function refreshSelected() {
        if (MessageCountHistory.length > 1) {
                var message_time_delta = MessageCountHistory[MessageCountHistory.length-1].time - MessageCountHistory[0].time;
                var message_count_delta = MessageCountHistory[MessageCountHistory.length-1].messages - MessageCountHistory[0].messages;
                if (message_time_delta > 0)
                        MessageRate = message_count_delta / message_time_delta;
        } else {
                MessageRate = null;
        }

	refreshPageTitle();
       
        var selected = false;
	if (typeof SelectedPlane !== 'undefined' && SelectedPlane != "ICAO" && SelectedPlane != null) {
    	        selected = Planes[SelectedPlane];
        }
        
        if (!selected) {
                $('#selected_infoblock').css('display','none');
                $('#dump1090_infoblock').css('display','block');
                $('#dump1090_version').text(Dump1090Version);
                $('#dump1090_total_ac').text(TrackedAircraft);
                $('#dump1090_total_ac_positions').text(TrackedAircraftPositions);
                $('#dump1090_total_history').text(TrackedHistorySize);

                if (MessageRate !== null) {
                        $('#dump1090_message_rate').text(MessageRate.toFixed(1));
                } else {
                        $('#dump1090_message_rate').text("n/a");
                }

                return;
        }
        
        $('#dump1090_infoblock').css('display','none');
        $('#selected_infoblock').css('display','block');
        
        if (selected.flight !== null && selected.flight !== "") {
                $('#selected_callsign').text(selected.flight);
                $('#selected_links').css('display','inline');
                $('#selected_fr24_link').attr('href','http://fr24.com/'+selected.flight);
                $('#selected_flightstats_link').attr('href','http://www.flightstats.com/go/FlightStatus/flightStatusByFlight.do?flightNumber='+selected.flight);
                $('#selected_flightaware_link').attr('href','http://flightaware.com/live/flight/'+selected.flight);
        } else {
                $('#selected_callsign').text('n/a');
                $('#selected_links').css('display','none');
        }

        if (selected.registration !== null) {
                $('#selected_registration').text(selected.registration);
        } else {
                $('#selected_registration').text("");
        }

        if (selected.icaotype !== null) {
                $('#selected_icaotype').text(selected.icaotype);
        } else {
                $('#selected_icaotype').text("");
        }

        var emerg = document.getElementById('selected_emergency');
        if (selected.squawk in SpecialSquawks) {
                emerg.className = SpecialSquawks[selected.squawk].cssClass;
                emerg.textContent = NBSP + 'Squawking: ' + SpecialSquawks[selected.squawk].text + NBSP ;
        } else {
                emerg.className = 'hidden';
        }

        $("#selected_altitude").text(format_altitude_long(selected.altitude, selected.vert_rate));

        if (selected.squawk === null || selected.squawk === '0000') {
                $('#selected_squawk').text('n/a');
        } else {
                $('#selected_squawk').text(selected.squawk);
        }
	
        $('#selected_speed').text(format_speed_long(selected.speed));
        $('#selected_icao').text(selected.icao.toUpperCase());
        $('#airframes_post_icao').attr('value',selected.icao);
	$('#selected_track').text(format_track_long(selected.track));

        if (selected.seen <= 1) {
                $('#selected_seen').text('now');
        } else {
                $('#selected_seen').text(selected.seen.toFixed(1) + 's');
        }

	if (selected.position === null) {
                $('#selected_position').text('n/a');
                $('#selected_follow').addClass('hidden');
        } else {
                var mlat_bit = (selected.position_from_mlat ? "MLAT: " : "");
                if (selected.seen_pos > 1) {
                        $('#selected_position').text(mlat_bit + format_latlng(selected.position) + " (" + selected.seen_pos.toFixed(1) + "s)");
                } else {
                        $('#selected_position').text(mlat_bit + format_latlng(selected.position));
                }
                $('#selected_follow').removeClass('hidden');
                if (FollowSelected) {
                        $('#selected_follow').css('font-weight', 'bold');
                        GoogleMap.panTo(selected.position);
                } else {
                        $('#selected_follow').css('font-weight', 'normal');
                }
	}
        
        $('#selected_sitedist').text(format_distance_long(selected.sitedist));
        $('#selected_rssi').text(selected.rssi.toFixed(1) + ' dBFS');
}

// Refreshes the larger table of all the planes
function refreshTableInfo() {
        var show_squawk_warning = false;

        TrackedAircraft = 0
        TrackedAircraftPositions = 0
        TrackedHistorySize = 0

        for (var i = 0; i < PlanesOrdered.length; ++i) {
		var tableplane = PlanesOrdered[i];
                TrackedHistorySize += tableplane.history_size;
		if (!tableplane.visible) {
                        tableplane.tr.className = "plane_table_row hidden";
                } else {
                        TrackedAircraft++;
                        var classes = "plane_table_row";

		        if (tableplane.position !== null && tableplane.seen_pos < 60) {
                                ++TrackedAircraftPositions;
                                if (tableplane.position_from_mlat)
                                        classes += " mlat";
				else
                                        classes += " vPosition";
			}
			if (tableplane.icao == SelectedPlane)
                                classes += " selected";
                        
                        if (tableplane.squawk in SpecialSquawks) {
                                classes = classes + " " + SpecialSquawks[tableplane.squawk].cssClass;
                                show_squawk_warning = true;
			}			                

                        // ICAO doesn't change
                        tableplane.tr.cells[1].textContent = (tableplane.flight !== null ? tableplane.flight : "");
                        tableplane.tr.cells[2].textContent = (tableplane.squawk !== null ? tableplane.squawk : "");    	                
                        tableplane.tr.cells[3].textContent = format_altitude_brief(tableplane.altitude, tableplane.vert_rate);
                        tableplane.tr.cells[4].textContent = format_speed_brief(tableplane.speed);
                        tableplane.tr.cells[5].textContent = format_distance_brief(tableplane.sitedist);			
                        tableplane.tr.cells[6].textContent = format_track_brief(tableplane.track);
                        tableplane.tr.cells[7].textContent = tableplane.messages;
                        tableplane.tr.cells[8].textContent = tableplane.seen.toFixed(0);
                
                        tableplane.tr.className = classes;

		}
	}

	if (show_squawk_warning) {
                $("#SpecialSquawkWarning").css('display','block');
        } else {
                $("#SpecialSquawkWarning").css('display','none');
        }

        resortTable();
}

//
// ---- table sorting ----
//

function compareAlpha(xa,ya) {
        if (xa === ya)
                return 0;
        if (xa < ya)
                return -1;
        return 1;
}

function compareNumeric(xf,yf) {
        if (Math.abs(xf - yf) < 1e-9)
                return 0;

        return xf - yf;
}

function sortByICAO()     { sortBy('icao',    compareAlpha,   function(x) { return x.icao; }); }
function sortByFlight()   { sortBy('flight',  compareAlpha,   function(x) { return x.flight; }); }
function sortBySquawk()   { sortBy('squawk',  compareAlpha,   function(x) { return x.squawk; }); }
function sortByAltitude() { sortBy('altitude',compareNumeric, function(x) { return (x.altitude == "ground" ? -1e9 : x.altitude); }); }
function sortBySpeed()    { sortBy('speed',   compareNumeric, function(x) { return x.speed; }); }
function sortByDistance() { sortBy('sitedist',compareNumeric, function(x) { return x.sitedist; }); }
function sortByTrack()    { sortBy('track',   compareNumeric, function(x) { return x.track; }); }
function sortByMsgs()     { sortBy('msgs',    compareNumeric, function(x) { return x.messages; }); }
function sortBySeen()     { sortBy('seen',    compareNumeric, function(x) { return x.seen; }); }

var sortId = '';
var sortCompare = null;
var sortExtract = null;
var sortAscending = true;

function sortFunction(x,y) {
        var xv = x._sort_value;
        var yv = y._sort_value;

        // always sort missing values at the end, regardless of
        // ascending/descending sort
        if (xv == null && yv == null) return x._sort_pos - y._sort_pos;
        if (xv == null) return 1;
        if (yv == null) return -1;

        var c = sortAscending ? sortCompare(xv,yv) : sortCompare(yv,xv);
        if (c !== 0) return c;

        return x._sort_pos - y._sort_pos;
}

function resortTable() {
        // number the existing rows so we can do a stable sort
        // regardless of whether sort() is stable or not.
        // Also extract the sort comparison value.
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                PlanesOrdered[i]._sort_pos = i;
                PlanesOrdered[i]._sort_value = sortExtract(PlanesOrdered[i]);
        }

        PlanesOrdered.sort(sortFunction);
        
        var tbody = document.getElementById('tableinfo').tBodies[0];
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                tbody.appendChild(PlanesOrdered[i].tr);
        }
}

function sortBy(id,sc,se) {
        if (id === sortId) {
                sortAscending = !sortAscending;
                PlanesOrdered.reverse(); // this correctly flips the order of rows that compare equal
        } else {
                sortAscending = true;
        }

        sortId = id;
        sortCompare = sc;
        sortExtract = se;

        resortTable();
}

function selectPlaneByHex(hex,autofollow) {
        //console.log("select: " + hex);
	// If SelectedPlane has something in it, clear out the selected
	if (SelectedPlane != null) {
		Planes[SelectedPlane].selected = false;
		Planes[SelectedPlane].clearLines();
		Planes[SelectedPlane].updateMarker();
                $(Planes[SelectedPlane].tr).removeClass("selected");
	}

	// If we are clicking the same plane, we are deselected it.
	if (SelectedPlane === hex) {
                hex = null;
        }

        if (hex !== null) {
		// Assign the new selected
		SelectedPlane = hex;
		Planes[SelectedPlane].selected = true;
		Planes[SelectedPlane].updateLines();
		Planes[SelectedPlane].updateMarker();
                $(Planes[SelectedPlane].tr).addClass("selected");
	} else { 
		SelectedPlane = null;
	}

        if (SelectedPlane !== null && autofollow) {
                FollowSelected = true;
                if (GoogleMap.getZoom() < 8)
                        GoogleMap.setZoom(8);
        } else {
                FollowSelected = false;
        } 

        refreshSelected();
}

function toggleFollowSelected() {
        FollowSelected = !FollowSelected;
        if (FollowSelected && GoogleMap.getZoom() < 8)
                GoogleMap.setZoom(8);
        refreshSelected();
}

function resetMap() {
        // Reset localStorage values and map settings
        localStorage['CenterLat'] = CenterLat = DefaultCenterLat;
        localStorage['CenterLon'] = CenterLon = DefaultCenterLon;
        localStorage['ZoomLvl']   = ZoomLvl = DefaultZoomLvl;

        // Set and refresh
	GoogleMap.setZoom(ZoomLvl);
	GoogleMap.setCenter(new google.maps.LatLng(CenterLat, CenterLon));
	
	selectPlaneByHex(null,false);
}

function drawCircle(marker, distance) {
    if (typeof distance === 'undefined') {
        return false;
        
        if (!(!isNaN(parseFloat(distance)) && isFinite(distance)) || distance < 0) {
            return false;
        }
    }
    
    distance *= 1000.0;
    if (!Metric) {
        distance *= 1.852;
    }
    
    // Add circle overlay and bind to marker
    var circle = new google.maps.Circle({
      map: GoogleMap,
      radius: distance, // In meters
      fillOpacity: 0.0,
      strokeWeight: 1,
      strokeOpacity: 0.3
    });
    circle.bindTo('center', marker, 'position');
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode('flags-tiny/' +  str + '.png'));
    return div.innerHTML;
};
