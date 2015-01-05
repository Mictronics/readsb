// Define our global variables
var GoogleMap     = null;
var Planes        = {};
var PlanesOnMap   = 0;
var PlanesOnTable = 0;
var PlanesToReap  = 0;
var SelectedPlane = null;
var SpecialSquawk = false;

var sortColumn = 3;
var sortAscending = true;
var sortNumeric = true;

// Get current map settings
CenterLat = Number(localStorage['CenterLat']) || CONST_CENTERLAT;
CenterLon = Number(localStorage['CenterLon']) || CONST_CENTERLON;
ZoomLvl   = Number(localStorage['ZoomLvl']) || CONST_ZOOMLVL;

Dump1090Version = "unknown version";
RefreshInterval = 1000;

function fetchData() {
	$.getJSON('data/aircraft.json', function(data) {
		PlanesOnMap = 0;
		SpecialSquawk = false;
		
		// Loop through all the planes in the data packet
                console.log("I was called\n");
                var now = data.now;
                var acs = data.aircraft;
		for (var j=0; j < acs.length; j++) {
                        var ac = acs[j];
			// Do we already have this plane object in Planes?
			// If not make it.
			if (Planes[ac.hex]) {
				var plane = Planes[ac.hex];
			} else {
				var plane = jQuery.extend(true, {}, planeObject);
                                Planes[ac.hex] = plane;
			}
			
                        // Set SpecialSquawk-value
                        if (ac.squawk == '7500' || ac.squawk == '7600' || ac.squawk == '7700') {
                                SpecialSquawk = true;
                        }
                        
			// Call the function update
			plane.funcUpdateData(now, ac);
		}
                
		PlanesOnTable = acs.length;
	});
}

function initialize() {
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
	if (SiteShow && (typeof SiteLat !==  'undefined' || typeof SiteLon !==  'undefined')) {
	    var siteMarker  = new google.maps.LatLng(SiteLat, SiteLon);
	    var markerImage = new google.maps.MarkerImage(
	        'http://maps.google.com/mapfiles/kml/pal4/icon57.png',
            new google.maps.Size(32, 32),   // Image size
            new google.maps.Point(0, 0),    // Origin point of image
            new google.maps.Point(16, 16)); // Position where marker should point 
	    var marker = new google.maps.Marker({
          position: siteMarker,
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
	window.setInterval(function() {
		fetchData();
		refreshTableInfo();
		refreshSelected();
		reaper();
		extendedPulse();
	}, RefreshInterval);
}

// This looks for planes to reap out of the master Planes variable
function reaper() {
	PlanesToReap = 0;
	// When did the reaper start?
	reaptime = new Date().getTime();
	// Loop the planes
	for (var reap in Planes) {
		// Is this plane possibly reapable?
		if (Planes[reap].reapable == true) {
			// Has it not been seen for 5 minutes?
			// This way we still have it if it returns before then
			// Due to loss of signal or other reasons
			if ((reaptime - Planes[reap].updated) > 300000) {
				// Reap it.
				delete Planes[reap];
			}
			PlanesToReap++;
		}
	};
} 

// Refresh the detail window about the plane
function refreshSelected() {
    var selected = false;
	if (typeof SelectedPlane !== 'undefined' && SelectedPlane != "ICAO" && SelectedPlane != null) {
    	selected = Planes[SelectedPlane];
    }
	
	var columns = 2;
	var html = '';
	
	if (selected) {
    	html += '<table id="selectedinfo" width="100%">';
    } else {
        html += '<table id="selectedinfo" class="dim" width="100%">';
    }
	
	// Flight header line including squawk if needed
	if (selected && selected.flight == "") {
	    html += '<tr><td colspan="' + columns + '" id="selectedinfotitle"><b>N/A (' +
	        selected.icao + ')</b>';
	} else if (selected && selected.flight != "") {
	    html += '<tr><td colspan="' + columns + '" id="selectedinfotitle"><b>' +
	        selected.flight + '</b>';
	} else {
	    html += '<tr><td colspan="' + columns + '" id="selectedinfotitle"><b>DUMP1090 ' + Dump1090Version + '</b>&nbsp;<a href="https://github.com/mutability/dump1090" target="_blank">[GitHub]</a>';
	}
	
	if (selected && selected.squawk == 7500) { // Lets hope we never see this... Aircraft Hijacking
		html += '&nbsp;<span class="squawk7500">&nbsp;Squawking: Aircraft Hijacking&nbsp;</span>';
	} else if (selected && selected.squawk == 7600) { // Radio Failure
		html += '&nbsp;<span class="squawk7600">&nbsp;Squawking: Radio Failure&nbsp;</span>';
	} else if (selected && selected.squawk == 7700) { // General Emergency
		html += '&nbsp;<span class="squawk7700">&nbsp;Squawking: General Emergency&nbsp;</span>';
	} else if (selected && selected.flight != '') {
		html += '&nbsp;<a href="http://fr24.com/'+selected.flight+'" target="_blank">[FR24]</a>';
	    html += '&nbsp;<a href="http://www.flightstats.com/go/FlightStatus/flightStatusByFlight.do?';
        html += 'flightNumber='+selected.flight+'" target="_blank">[FlightStats]</a>';
	    html += '&nbsp;<a href="http://flightaware.com/live/flight/'+selected.flight+'" target="_blank">[FlightAware]</a>';
	}
	html += '<td></tr>';
	
	if (selected && selected.altitude !== null) {
            if (selected.altitude === "ground")
        	    html += '<tr><td>Altitude: on ground</td>';
            else if (Metric) {
        	    html += '<tr><td>Altitude: ' + Math.round(selected.altitude / 3.2828) + ' m</td>';
            } else {
                    html += '<tr><td>Altitude: ' + selected.altitude + ' ft</td>';
            }
        } else {
                html += '<tr><td>Altitude: n/a</td>';
        }
		
	if (selected && selected.squawk != '0000') {
		html += '<td>Squawk: ' + selected.squawk + '</td></tr>';
	} else {
	    html += '<td>Squawk: n/a</td></tr>';
	}
	
	html += '<tr><td>Speed: ' 
	if (selected) {
	    if (Metric) {
	        html += Math.round(selected.speed * 1.852) + ' km/h';
	    } else {
	        html += selected.speed + ' kt';
	    }
	} else {
	    html += 'n/a';
	}
	html += '</td>';
	
	if (selected) {
        html += '<td>ICAO (hex): ' + selected.icao + '</td></tr>';
    } else {
        html += '<td>ICAO (hex): n/a</td></tr>'; // Something is wrong if we are here
    }
    
    html += '<tr><td>Track: ' 
	if (selected && selected.track !== null) {
	    html += selected.track + '&deg;' + ' (' + trackLongName(selected.track) +')';
	} else {
	    html += 'n/a';
	}
	html += '</td><td>&nbsp;</td></tr>';

	html += '<tr><td colspan="' + columns + '" align="center">Lat/Long: ';
	if (selected && selected.latitude !== null) {
	    html += selected.latitude + ', ' + selected.longitude + '</td></tr>';
	    
	    // Let's show some extra data if we have site coordinates
	    if (SiteShow) {
            var siteLatLon  = new google.maps.LatLng(SiteLat, SiteLon);
            var planeLatLon = new google.maps.LatLng(selected.latitude, selected.longitude);
            var dist = google.maps.geometry.spherical.computeDistanceBetween (siteLatLon, planeLatLon);
            
            if (Metric) {
                dist /= 1000;
            } else {
                dist /= 1852;
            }
            dist = (Math.round((dist)*10)/10).toFixed(1);
            html += '<tr><td colspan="' + columns + '" align="center">Distance from Site: ' + dist +
                (Metric ? ' km' : ' NM') + '</td></tr>';
        } // End of SiteShow
	} else {
	    if (SiteShow) {
	        html += '<tr><td colspan="' + columns + '" align="center">Distance from Site: n/a ' + 
	            (Metric ? ' km' : ' NM') + '</td></tr>';
	    } else {
    	    html += 'n/a</td></tr>';
    	}
	}

	html += '</table>';
	
	document.getElementById('plane_detail').innerHTML = html;
}

function trackShortName(track) {
        var trackIndex = Math.floor((track+22.5) / 45);
        if ((trackIndex < 0) || (trackIndex >= 8))
            return "n/a";
        return ["N","NE","E","SE","S","SW","W","NW"][trackIndex];
}

function trackLongName(track) {
        var trackIndex = Math.floor((track+22.5) / 45);
        if ((trackIndex < 0) || (trackIndex >= 8))
            return "n/a";
        return ["North","Northeast","East","Southeast","South","Southwest","West","Northwest"][trackIndex];
}

// Refeshes the larger table of all the planes

function refreshTableInfo() {
	var html = '<table id="tableinfo" width="100%">';
	html += '<thead style="background-color: #BBBBBB; cursor: pointer;">';
	html += '<td id="icao" onclick="sortBy(\'icao\',false);">ICAO</td>';
	html += '<td id="flight" onclick="sortBy(\'flight\',false);">Flight</td>';
	html += '<td id="squawk" onclick="sortBy(\'squawk\',false);" align="right">Squawk</td>';
	html += '<td id="altitude" onclick="sortBy(\'altitude\',true);" align="right">Altitude</td>';
	html += '<td id="speed" onclick="sortBy(\'speed\',true);" align="right">Speed</td>';
        // Add distance column header to table if site coordinates are provided        
        if (SiteShow && (typeof SiteLat !==  'undefined' || typeof SiteLon !==  'undefined')) {
                html += '<td id="distance" onclick="sortBy(\'distance\',true);" align="right">Distance</td>';
        }
	html += '<td id="track" onclick="sortBy(\'track\',true);" align="right">Track</td>';
	html += '<td id="msgs" onclick="sortBy(\'msgs\',true);" align="right">Msgs</td>';
	html += '<td id="seen" onclick="sortBy(\'seen\',true);" align="right">Seen</td></thead><tbody>';

	for (var tablep in Planes) {
		var tableplane = Planes[tablep]
		if (!tableplane.reapable) {
			var specialStyle = "";
			// Is this the plane we selected?
			if (tableplane.icao == SelectedPlane) {
				specialStyle += " selected";
			}
			// Lets hope we never see this... Aircraft Hijacking
			if (tableplane.squawk == 7500) {
				specialStyle += " squawk7500";
			}
			// Radio Failure
			if (tableplane.squawk == 7600) {
				specialStyle += " squawk7600";
			}
			// Emergancy
			if (tableplane.squawk == 7700) {
				specialStyle += " squawk7700";
			}
			
			if (tableplane.latitude !== null)
				html += '<tr class="plane_table_row vPosition' + specialStyle + '">';
                        else
				html += '<tr class="plane_table_row ' + specialStyle + '">';
		        
			html += '<td>' + tableplane.icao + '</td>';

                        if (tableplane.flight !== null)
			        html += '<td>' + tableplane.flight + '</td>';
                        else
			        html += '<td></td>';
                        
			if (tableplane.squawk !== null)
    			        html += '<td align="right">' + tableplane.squawk + '</td>';
                        else
    	                        html += '<td align="right"></td>';
    	                
                        if (tableplane.altitude === null)
    		                html += '<td align="right">&nbsp;</td>';
                        else if (tableplane.altitude === "ground")
    		                html += '<td align="right">ground</td>';
                        else if (Metric)
    			        html += '<td align="right">' + Math.round(tableplane.altitude / 3.2828) + '</td>';
                        else
    	                        html += '<td align="right">' + tableplane.altitude + '</td>';
                                        
                        if (tableplane.speed === null)
    		                html += '<td align="right">&nbsp;</td>';
                        else if (Metric)
    		                html += '<td align="right">' + Math.round(tableplane.speed * 1.852) + '</td>';
                        else
    	                        html += '<td align="right">' + tableplane.speed + '</td>';
                        
                        // Add distance column to table if site coordinates are provided
                        if (SiteShow && (typeof SiteLat !==  'undefined' || typeof SiteLon !==  'undefined')) {
                                html += '<td align="right">';
                                if (tableplane.latitude !== null) {
                                        var siteLatLon  = new google.maps.LatLng(SiteLat, SiteLon);
                                        var planeLatLon = new google.maps.LatLng(tableplane.latitude, tableplane.longitude);
                                        var dist = google.maps.geometry.spherical.computeDistanceBetween (siteLatLon, planeLatLon);
                                        if (Metric) {
                                                dist /= 1000;
                                        } else {
                                                dist /= 1852;
                                        }
                                        dist = (Math.round((dist)*10)/10).toFixed(1);
                                        html += dist;
                                }
                                html += '</td>';
                        }
			
			html += '<td align="right">';
			if (tableplane.track !== null)
    			        html += tableplane.track;
    	                html += '</td>';
			html += '<td align="right">' + tableplane.messages + '</td>';
			html += '<td align="right">' + tableplane.seen + '</td>';
			html += '</tr>';
		}
	}
	html += '</tbody></table>';
        
	document.getElementById('planes_table').innerHTML = html;
        
	if (SpecialSquawk) {
    	        $('#SpecialSquawkWarning').css('display', 'inline');
        } else {
                $('#SpecialSquawkWarning').css('display', 'none');
        }
        
	// Click event for table
	$('#planes_table').find('tr').click( function(){
		var hex = $(this).find('td:first').text();
		if (hex != "ICAO") {
			selectPlaneByHex(hex);
			refreshTableInfo();
			refreshSelected();
		}
	});
        
	resortTable();
}

function sortBy(colName,numeric) {
        var header_cells = document.getElementById('tableinfo').tHead.rows[0].cells;
        for (var i = 0; i < header_cells.length; ++i) {
                if (header_cells[i].id === colName) {
                        if (i == sortColumn)
                                sortAscending = !sortAscending;
                        else {
                                sortColumn = i;
                                sortNumeric = numeric;
                                sortAscending = true;
                        }

                        resortTable();
                        return;
                }
        }

        console.warn("column not found: " + colName);
}

function resortTable() {
        sortTable('tableinfo', sortColumn, sortAscending, sortNumeric);
}

function sortTable(tableId, col, asc, numeric) { 
	//retrieve passed table element
	var oTbl=document.getElementById(tableId).tBodies[0];
	var aStore=[];
        
	//loop through the rows, storing each one inro aStore
	for (var i=0; i < oTbl.rows.length; ++i){
		var oRow=oTbl.rows[i];
                var sortKey;
                if (numeric) {
                        sortKey = parseFloat(oRow.cells[col].textContent||oRow.cells[col].innerText);
                        if (isNaN(sortKey)) {
                                sortKey = -999999;
                        }
                } else {
                        sortKey = String(oRow.cells[col].textContent||oRow.cells[col].innerText);
                }
		aStore.push([sortKey,oRow]);
	}

	if (numeric) { //numerical sort
		aStore.sort(function(x,y){ return sortAscending ? x[0]-y[0] : y[0]-x[0]; });
	} else { //alpha sort
		aStore.sort();
		if (!sortAscending) {
			aStore.reverse();
	    }
	}

	//rewrite the table rows to the passed table element
	for(var i=0,iLen=aStore.length;i<iLen;i++){
		oTbl.appendChild(aStore[i][1]);
	}
}

function selectPlaneByHex(hex) {
	// If SelectedPlane has something in it, clear out the selected
	if (SelectedPlane != null) {
		Planes[SelectedPlane].is_selected = false;
		Planes[SelectedPlane].funcClearLine();
		Planes[SelectedPlane].markerColor = MarkerColor;
		// If the selected has a marker, make it not stand out
		if (Planes[SelectedPlane].marker) {
			Planes[SelectedPlane].marker.setIcon(Planes[SelectedPlane].funcGetIcon());
		}
	}

	// If we are clicking the same plane, we are deselected it.
	if (String(SelectedPlane) != String(hex)) {
		// Assign the new selected
		SelectedPlane = hex;
		Planes[SelectedPlane].is_selected = true;
		// If the selected has a marker, make it stand out
		if (Planes[SelectedPlane].marker) {
			Planes[SelectedPlane].funcUpdateLines();
			Planes[SelectedPlane].marker.setIcon(Planes[SelectedPlane].funcGetIcon());
		}
	} else { 
		SelectedPlane = null;
	}
    refreshSelected();
    refreshTableInfo();
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
