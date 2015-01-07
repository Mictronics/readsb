// Define our global variables
var GoogleMap     = null;
var Planes        = {};
var PlanesOrdered = [];
var SelectedPlane = null;

var EmergencySquawks = {
        '7500' : 'Aircraft Hijacking',
        '7600' : 'Radio Failure',
        '7700' : 'General Emergency'
};

// Get current map settings
CenterLat = Number(localStorage['CenterLat']) || CONST_CENTERLAT;
CenterLon = Number(localStorage['CenterLon']) || CONST_CENTERLON;
ZoomLvl   = Number(localStorage['ZoomLvl']) || CONST_ZOOMLVL;

Dump1090Version = "unknown version";
RefreshInterval = 1000;

PlaneRowTemplate = null;

TrackedAircraft = 0
TrackedPositions = 0

function fetchData() {
	$.getJSON('data/aircraft.json', function(data) {
		// Loop through all the planes in the data packet
                var now = data.now;
                var acs = data.aircraft;
		for (var j=0; j < acs.length; j++) {
                        var ac = acs[j];
                        var hex = ac.hex;
                        var plane = null;

			// Do we already have this plane object in Planes?
			// If not make it.
                        
			if (Planes[hex]) {
				plane = Planes[hex];
			} else {
				plane = jQuery.extend(true, {}, planeObject);

                                plane.tr = PlaneRowTemplate.cloneNode(true);
                                plane.tr.cells[0].textContent = hex; // this won't change
                                plane.tr.addEventListener('click', $.proxy(plane.selectPlane, plane));
                                plane.sitedist = null;

                                Planes[hex] = plane;
                                PlanesOrdered.push(plane);
			}
			
			// Call the function update
			plane.updateData(now, ac);
		}

                // update timestamps, visibility, history track for all planes - not only those updated
                for (var i = 0; i < PlanesOrdered.length; ++i) {
                        var plane = PlanesOrdered[i];
                        plane.updateTick(now);
                }
                
		refreshTableInfo();
		refreshSelected();
	});
}

function initialize() {
        PlaneRowTemplate = document.getElementById("plane_row_template");

        if (!ShowClocks) {
                $('#timestamps').css('display','none');
        }
        
        // Get receiver metadata, reconfigure using it, then continue
        // with initialization
	$.getJSON('data/receiver.json')
                .done(function(data) {
                        if (typeof data.lat !== "undefined") {
                                SiteShow = true;
                                SiteLat = data.lat;
                                SiteLon = data.lon;
                                CONST_CENTERLAT = data.lat;
                                CONST_CENTERLON = data.lon;
                        }
                        
                        Dump1090Version = data.version;
                        RefreshInterval = data.refresh;
                })
                .always(initialize_after_config);
}

// Initalizes the map and starts up our timers to call various functions
function initialize_after_config() {
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
          title: 'My Radar Site',
          zIndex: -99999
        });
        
        if (SiteCircles) {
            for (var i=0;i<SiteCirclesDistances.length;i++) {
              drawCircle(marker, SiteCirclesDistances[i]); // in meters
            }
        }
	}
	
	// These will run after page is complitely loaded
	$(window).load(function() {
        $('#dialog-modal').css('display', 'inline'); // Show hidden settings-windows content
    });

	// Load up our options page
	optionsInitalize();

	// Did our crafty user need some setup?
	extendedInitalize();
	
	// Setup our timer to poll from the server.
	window.setInterval(fetchData, RefreshInterval);
        window.setInterval(reaper, 60000);
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

// Refresh the detail window about the plane
function refreshSelected() {
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
                $('#selected_callsign').text('n/a (' + selected.icao + ')');
                $('#selected_links').css('display','none');
        }
                
        var emerg = document.getElementById('selected_emergency');
        if (selected.squawk in EmergencySquawks) {
                emerg.className = 'squawk' + selected.squawk;
                emerg.textContent = '\u00a0Squawking: ' + EmergencySquawks[selected.squawk] + '\u00a0';
        } else {
                emerg.className = 'hidden';
        }

        if (selected.altitude === null)
                $("#selected_altitude").text("n/a");
        else if (selected.altitude === "ground")
                $("#selected_altitude").text("on ground");
        else if (Metric)
                $("#selected_altitude").text(Math.round(selected.altitude / 3.2828) + ' m');
        else
                $("#selected_altitude").text(Math.round(selected.altitude) + ' ft');

        if (selected.squawk === null || selected.squawk === '0000') {
                $('#selected_squawk').text('n/a');
        } else {
                $('#selected_squawk').text(selected.squawk);
        }
	
        if (selected.speed === null) {
                $('#selected_speed').text('n/a');
	} else if (Metric) {
	        $('#selected_speed').text(Math.round(selected.speed * 1.852) + ' km/h');
	} else {
	        $('#selected_speed').text(Math.round(selected.speed) + ' kt');
	}

        $('#selected_icao').text(selected.icao);

        if (selected.track === null) {
                $('#selected_track').text('n/a');
	} else {
	        $('#selected_track').text(selected.track + '\u00b0' + ' (' + trackLongName(selected.track) + ')');
	}

        if (selected.seen <= 1) {
                $('#selected_seen').text('now');
        } else {
                $('#selected_seen').text(selected.seen + 's ago');
        }

	if (selected.latitude === null) {
                $('#selected_position').text('n/a');
        } else {
                if (selected.seen_pos > 1) {
                        $('#selected_position').text(selected.latitude + ', ' + selected.longitude + " (" + selected.seen_pos + "s ago)");
                } else {
                        $('#selected_position').text(selected.latitude + ', ' + selected.longitude);
                }
	}

        if (selected.sitedist !== null) {
                var dist = selected.sitedist;
                if (Metric) {
                        dist /= 1000;
                } else {
                        dist /= 1852;
                }

                dist = (Math.round((dist)*10)/10).toFixed(1);

                $('#selected_sitedist').text(dist + (Metric ? ' km' : ' NM'));
	} else {
                $('#selected_sitedist').text("n/a");
        }
}

function trackShortName(track) {
        var trackIndex = Math.floor((360 + track % 360 + 22.5) / 45) % 8;
        return ["N","NE","E","SE","S","SW","W","NW"][trackIndex];
}

function trackLongName(track) {
        var trackIndex = Math.floor((360 + track % 360 + 22.5) / 45) % 8;
        return ["North","Northeast","East","Southeast","South","Southwest","West","Northwest"][trackIndex];
}

// Refeshes the larger table of all the planes

function format_altitude(alt) {
        if (alt === null)
                return "";
        else if (alt === "ground")
                return "ground";
        else if (Metric)
                return Math.round(alt / 3.2828);
        else
                return Math.round(alt);
}

function format_speed(speed) {                                        
        if (speed === null)
                return "";
        else if (Metric)
    		return Math.round(speed * 1.852);
        else
                return Math.round(speed);
}

function format_distance(dist) {
        if (Metric) {
                return (Math.round(dist/100) / 10).toFixed(1);
        } else {
                return (Math.round(dist/185.2) / 10).toFixed(1);
        }
}

function refreshTableInfo() {
        var show_squawk_warning = false;

        TrackedAircraft = 0
        TrackedAircraftPositions = 0
        TrackedHistorySize = 0

        for (var i = 0; i < PlanesOrdered.length; ++i) {
		var tableplane = PlanesOrdered[i];
                TrackedHistorySize += tableplane.historySize;
		if (!tableplane.visible) {
                        tableplane.tr.className = "plane_table_row hidden";
                } else {
                        TrackedAircraft++;
                        var classes = "plane_table_row";
                        
			if (tableplane.latitude !== null)
                                classes += " vPosition";
			if (tableplane.icao == SelectedPlane)
                                classes += " selected";
                        
                        if (tableplane.squawk in EmergencySquawks) {
                                classes += (" squawk" + tableplane.squawk);
                                show_squawk_warning = true;
			}			                

                        // ICAO doesn't change
                        tableplane.tr.cells[1].textContent = (tableplane.flight !== null ? tableplane.flight : "");
                        tableplane.tr.cells[2].textContent = (tableplane.squawk !== null ? tableplane.squawk : "");    	                
                        tableplane.tr.cells[3].textContent = format_altitude(tableplane.altitude);
                        tableplane.tr.cells[4].textContent = format_speed(tableplane.speed);

                        if (tableplane.latitude !== null)
                                ++TrackedAircraftPositions;
                        
                        // Add distance column to table if site coordinates are provided
                        if (SitePosition !== null && tableplane.latitude !== null) {
                                var planeLatLon = new google.maps.LatLng(tableplane.latitude, tableplane.longitude);
                                var dist = google.maps.geometry.spherical.computeDistanceBetween (SitePosition, planeLatLon);
                                tableplane.tr.cells[5].textContent = format_distance(dist);
                                tableplane.sitedist = dist;
                        } else {
                                tableplane.tr.cells[5].textContent = "";
                        }
			
                        tableplane.tr.cells[6].textContent = (tableplane.track !== null ? tableplane.track : "");
                        tableplane.tr.cells[7].textContent = tableplane.messages;
                        tableplane.tr.cells[8].textContent = tableplane.seen;
                
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

function compareAlpha(xa,xo,ya,yo) {
        if (xa === ya)
                return xo - yo;
        if (xa === null)
                return 1;
        if (ya === null)
                return -1;
        if (xa < ya)
                return -1;
        return 1;
}

function compareNumeric(xf,xo,yf,yo) {
        if (xf === null) xf = 1e9;
        if (yf === null) yf = 1e9;

        if (Math.abs(xf - yf) < 1e-9)
                return xo - yo;        

        return xf - yf;
}

function compareAltitude(xf,xo,yf,yo) {
        if (xf === null) xf = 1e9;
        else if (xf === "ground") xf = -1e9;
        if (yf === null) yf = 1e9;
        else if (yf === "ground") yf = -1e9;

        if (Math.abs(xf - yf) < 1e-9)
                return xo - yo;        

        return xf - yf;
}

function sortByICAO()     { sortBy('icao',    function(x,y){return compareAlpha(x.icao, x.sort_pos, y.icao, y.sort_pos)}); } 
function sortByFlight()   { sortBy('flight',  function(x,y){return compareAlpha(x.flight, x.sort_pos, y.flight, y.sort_pos)}); } 
function sortBySquawk()   { sortBy('squawk',  function(x,y){return compareAlpha(x.squawk, x.sort_pos, y.squawk, y.sort_pos)}); }
function sortByAltitude() { sortBy('altitude',function(x,y){return compareAltitude(x.altitude, x.sort_pos, y.altitude, y.sort_pos)}); }
function sortBySpeed()    { sortBy('speed',   function(x,y){return compareNumeric(x.speed, x.sort_pos, y.speed, y.sort_pos)}); }
function sortByDistance() { sortBy('sitedist',function(x,y){return compareNumeric(x.sitedist, x.sort_pos, y.sitedist, y.sort_pos)}); }
function sortByTrack()    { sortBy('track',   function(x,y){return compareNumeric(x.track, x.sort_pos, y.track, y.sort_pos)}); }
function sortByMsgs()     { sortBy('msgs',    function(x,y){return compareNumeric(x.msgs, x.sort_pos, y.msgs, y.sort_pos)}); }
function sortBySeen()     { sortBy('seen',    function(x,y){return compareNumeric(x.seen, x.sort_pos, y.seen, y.sort_pos)}); }

sortId = '';
sortByFunc = null;
sortAscending = true;

function resortTable() {
        // make it a stable sort
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                PlanesOrdered[i].sort_pos = i;
        }

        PlanesOrdered.sort(sortByFunc);
        
        var tbody = document.getElementById('tableinfo').tBodies[0];
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                tbody.appendChild(PlanesOrdered[i].tr);
        }
}

function sortBy(id,sortfunc) {
        if (id === sortId) {
                sortAscending = !sortAscending;
        } else {
                sortAscending = true;
        }

        if (sortAscending)
                sortByFunc = sortfunc;
        else
                sortByFunc = function(x,y){return sortfunc(y,x);}

        sortId = id;
        resortTable();
}

function selectPlaneByHex(hex) {
        //console.log("select: " + hex);
	// If SelectedPlane has something in it, clear out the selected
	if (SelectedPlane != null) {
		Planes[SelectedPlane].is_selected = false;
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
		Planes[SelectedPlane].is_selected = true;
		Planes[SelectedPlane].updateLines();
		Planes[SelectedPlane].updateMarker();
                $(Planes[SelectedPlane].tr).addClass("selected");
	} else { 
		SelectedPlane = null;
	}

        refreshSelected();
}

function resetMap() {
    // Reset localStorage values
    localStorage['CenterLat'] = CONST_CENTERLAT;
    localStorage['CenterLon'] = CONST_CENTERLON;
    localStorage['ZoomLvl']   = CONST_ZOOMLVL;
    
    // Try to read values from localStorage else use CONST_s
    CenterLat = Number(localStorage['CenterLat']) || CONST_CENTERLAT;
    CenterLon = Number(localStorage['CenterLon']) || CONST_CENTERLON;
    ZoomLvl   = Number(localStorage['ZoomLvl']) || CONST_ZOOMLVL;
    
    // Set and refresh
	GoogleMap.setZoom(parseInt(ZoomLvl));
	GoogleMap.setCenter(new google.maps.LatLng(parseFloat(CenterLat), parseFloat(CenterLon)));
	
	if (SelectedPlane) {
	    selectPlaneByHex(SelectedPlane);
	}

	refreshSelected();
	refreshTableInfo();
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
