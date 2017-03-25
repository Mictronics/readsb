// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// filters.js: filter aircraft by metadata
//
// Copyright (c) 2017 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you may copy, redistribute and/or modify it
// under the terms of the GNU General Public License as published by the
// Free Software Foundation, either version 2 of the License, or (at your
// option) any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var Filter;
(function(Filter) {
    Filter.isEnabled = false;
    Filter.isHighlight = false;
    
    Filter.AircraftFilter = {
        Altitude:       'alt',
        Ident:          'idn',
        Country:        'cou',
        Distance:       'dis',
        HideNoPosition: 'hnp',
        Icao:           'ico',
        IsMilitary:     'mil',
        TypeIcao:       'typ',
        Operator:       'opr',
        OperatorCode:   'opc',
        Registration:   'reg',
        Species:        'spc',
        Squawk:         'sqk',
        UserInterested: 'int',
        Wtc:            'wtc'
    };
    
    Filter.FilterType = {
        OnOff:          0,
        TextMatch:      1,
        NumberRange:    2,
        EnumMatch:      3
    };
    
    Filter.InputWidth = {
        Auto: '',
        OneChar: 'oneChar',
        ThreeChar: 'threeChar',
        SixChar: 'sixChar',
        EightChar: 'eightChar',
        NineChar: 'nineChar',
        Long: 'wide'
    };
    
    Filter.Species = {
        None: 0,
        LandPlane: 1,
        SeaPlane: 2,
        Amphibian: 3,
        Helicopter: 4,
        Gyrocopter: 5,
        Tiltwing: 6,
        GroundVehicle: 7,
        Tower: 8
    };
    
    Filter.WakeTurbulenceCategory = {
        None: 0,
        Light: 1,
        Medium: 2,
        Heavy: 3
    };
       
    Filter.Condition = {
        Equals: 0,
        NotEquals: 1,
        Contains: 2,
        NotContains: 3,
        Between: 4,
        NotBetween: 5,
        Starts: 6,
        NotStarts: 7,
        Ends: 8,
        NotEnds: 9
    };
    
    Filter.ValueText = (function () {
        function ValueText(settings) {
            this.value = settings.value;
            this.text = settings.text;
            this.selected = false;
        }
        return ValueText;
    }());    
    
    Filter.ConditionList = [
        new Filter.ValueText({value: Filter.Condition.Equals, text: "equals"}),
        new Filter.ValueText({value: Filter.Condition.NotEquals, text: "not equals"}),
        new Filter.ValueText({value: Filter.Condition.Contains, text: "contains"}),
        new Filter.ValueText({value: Filter.Condition.NotContains, text: "not contains"}),
        new Filter.ValueText({value: Filter.Condition.Between, text: "is between"}),
        new Filter.ValueText({value: Filter.Condition.NotBetween, text: "is not between"}),
        new Filter.ValueText({value: Filter.Condition.Starts, text: "starts with"}),
        new Filter.ValueText({value: Filter.Condition.NotStarts, text: "starts not with"}),
        new Filter.ValueText({value: Filter.Condition.Ends, text: "ends with"}),
        new Filter.ValueText({value: Filter.Condition.NotEnds, text: "ends not with"})
    ];
    
    var AircraftFilterHandler = (function () {
        function AircraftFilterHandler(settings) {
            $.extend(this, settings);
            if (!settings.isFiltered)
                throw 'You must supply a filter function.';
            this.isActive = false;
            this.value1;
            this.value2;
        }
        return AircraftFilterHandler;
    }());

    Filter.AircraftFilterHandler = AircraftFilterHandler;
    Filter.aircraftFilterHandlers = Filter.aircraftFilterHandlers || {};

    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Altitude] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Altitude,
        type: Filter.FilterType.NumberRange,
        label: 'Altitude',
        minimumValue: -2000,
        maximumValue: 100000,
        decimalPlaces: 0,
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Between,
        getFilterConditions: [Filter.Condition.Between, Filter.Condition.NotBetween],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined && this.value2 !== undefined){
                if(aircraft.altitude === null) return true;
                var f = true;
                var a = convert_altitude(aircraft.altitude, DisplayUnits);
                if(a >= this.value1 && a <= this.value2) f = false;
                if(this.condition === Filter.Condition.NotBetween) f = !f;
                return f;                
            }
            return false; 
        },
        validate: function(){
            this.value1 = Filter.validateNumber(this.value1, this.minimumValue, this.maximumValue);
            this.value2 = Filter.validateNumber(this.value2, this.minimumValue, this.maximumValue);
        },
        convertUnit(displayUnits){
            if(this.value1 !== undefined && this.value2 !== undefined){
                this.value1 = convert_altitude(this.value1, displayUnits);
                this.value2 = convert_altitude(this.value2, displayUnits);
            }
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Ident] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Ident,
        type: Filter.FilterType.TextMatch,
        label: 'Ident',
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                return Filter.filterText(aircraft.flight, this.value1, this.condition);                
            }
            return false; 
        },
        validate: function(){
            var s = this.value1.trim().substr(0,7).toUpperCase();
            this.value1 = s.replace(/[^0-9A-Z]/, "");
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Country] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Country,
        type: Filter.FilterType.TextMatch,
        label: 'Country',
        inputWidth: Filter.InputWidth.Long,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && aircraft.icao !== null && this.value1 !== undefined){
                var f = findICAORange(aircraft.icao);
                return Filter.filterText(f.country, this.value1, this.condition);                
            }
            return false; 
        },
        validate: function(){
            this.value1 = this.value1.trim().substr(0,30);
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Distance] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Distance,
        type: Filter.FilterType.NumberRange,
        label: 'Distance',
        minimumValue: 0,
        maximumValue: 30000,
        decimalPlaces: 2,
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Between,
        getFilterConditions: [Filter.Condition.Between, Filter.Condition.NotBetween],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined && this.value2 !== undefined){
                if(aircraft.sitedist === null) return true;
                var f = true;
                var s = convert_distance(aircraft.sitedist, DisplayUnits);
                if(s >= this.value1 && s <= this.value2) f = false;
                if(this.condition === Filter.Condition.NotBetween) f = !f;
                return f;                
            }
            return false; 
        },
        validate: function(){
            this.value1 = Filter.validateNumber(this.value1, this.minimumValue, this.maximumValue);
            this.value2 = Filter.validateNumber(this.value2, this.minimumValue, this.maximumValue);
        },
        convertUnit(displayUnits){
            if(this.value1 !== undefined && this.value2 !== undefined){
                this.value1 = convert_distance(this.value1, displayUnits);
                this.value2 = convert_distance(this.value2, displayUnits);
            }
        }
     });

    Filter.aircraftFilterHandlers[Filter.AircraftFilter.IsMilitary] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.IsMilitary,
        type: Filter.FilterType.OnOff,
        label: 'Is Military',
        getFilterConditions: [],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1){
                if(aircraft.civilmil !== null)
                    return true;
                else
                    return !aircraft.civilmil;
            }
            return false; 
        },
        validate: function(){
            return this.value1;
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.UserInterested] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.UserInterested,
        type: Filter.FilterType.OnOff,
        label: 'Interesting',
        condition: Filter.Condition.Equals,
        getFilterConditions: [],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1){
                if(aircraft.interesting !== null)
                    return true;
                else
                    return !aircraft.interesting;
            }
            return false; 
        },
        validate: function(){
            return this.value1;
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.HideNoPosition] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.HideNoPosition,
        type: Filter.FilterType.OnOff,
        label: 'Hide No Position',
        getFilterConditions: [],
        isFiltered: function(aircraft){
            if(this.isActive && aircraft.position === null && this.value1){
                return true;
            }
            return false; 
        },
        validate: function(){
            return this.value1;
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Icao] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Icao,
        type: Filter.FilterType.TextMatch,
        label: 'Icao',
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                return Filter.filterText(aircraft.icao, this.value1, this.condition); 
            }
            return false; 
        },
        validate: function(){
            var s = this.value1.trim().substr(0,6).toUpperCase();
            this.value1 = s.replace(/[^0-9A-F]/, "");
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.TypeIcao] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.TypeIcao,
        type: Filter.FilterType.TextMatch,
        label: 'Type Icao',
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                return Filter.filterText(aircraft.icaotype, this.value1, this.condition); 
            }
            return false; 
        },
        validate: function(){
            var s = this.value1.trim().substr(0,4).toUpperCase();
            this.value1 = s.replace(/[^0-9A-Z]/, "");
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Operator] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Operator,
        type: Filter.FilterType.TextMatch,
        label: 'Operator',
        inputWidth: Filter.InputWidth.Long,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                return Filter.filterText(aircraft.operator, this.value1, this.condition);                 
            }
            return false; 
        },
        validate: function(){
            this.value1 = this.value1.trim().substr(0,30);
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.OperatorCode] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.OperatorCode,
        type: Filter.FilterType.TextMatch,
        label: 'Operator Code',
        inputWidth: Filter.InputWidth.ThreeChar,
        condition: Filter.Condition.Equals,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                if(aircraft.flight === null) return true;
                var oc = aircraft.flight.substr(0,3).toUpperCase();
                var f = true;
                if(oc === this.value1) f = false;
                if(this.condition === Filter.Condition.NotEquals) f = !f;
                return f;
            }
            return false; 
        },
        validate: function(){
            var s = this.value1.trim().substr(0,3).toUpperCase();
            this.value1 = s.replace(/[^0-9A-Z]/, "");
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Registration] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Registration,
        type: Filter.FilterType.TextMatch,
        label: 'Registration',
        inputWidth: Filter.InputWidth.NineChar,
        condition: Filter.Condition.Contains,
        getFilterConditions: 
             [ Filter.Condition.Equals,
               Filter.Condition.NotEquals,
               Filter.Condition.Contains,
               Filter.Condition.NotContains,
               Filter.Condition.Starts,
               Filter.Condition.NotStarts,
               Filter.Condition.Ends,
               Filter.Condition.NotEnds
             ],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined){
                var r = aircraft.registration;
                if(r !== null && r.startsWith("#"))
                    r = r.substr(2); // Remove DB entry marker if exists
                return Filter.filterText(r, this.value1, this.condition);     
            }
            return false; 
        },
        validate: function(){
            var s = this.value1.trim().substr(0,10).toUpperCase();
            this.value1 = s.replace(/[^0-9A-Z-+]/, "");
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Species] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Species,
        type: Filter.FilterType.EnumMatch,
        label: 'Species',
        condition: Filter.Condition.Equals,
        getFilterConditions: [Filter.Condition.Equals, Filter.Condition.NotEquals],
        getEnumValues: 
            [
                new Filter.ValueText({ value: Filter.Species.None, text: 'None' }),
                new Filter.ValueText({ value: Filter.Species.LandPlane, text: 'Land Plane' }),
                new Filter.ValueText({ value: Filter.Species.SeaPlane, text: 'Sea Plane' }),
                new Filter.ValueText({ value: Filter.Species.Amphibian, text: 'Amphibian' }),
                new Filter.ValueText({ value: Filter.Species.Helicopter, text: 'Helicopter' }),
                new Filter.ValueText({ value: Filter.Species.Gyrocopter, text: 'Gyrocopter' }),
                new Filter.ValueText({ value: Filter.Species.Tiltwing, text: 'Tiltwing' }),
                new Filter.ValueText({ value: Filter.Species.GroundVehicle, text: 'Ground Vehicle' }),
                new Filter.ValueText({ value: Filter.Species.Tower, text: 'Radio Mast' })
            ],
        isFiltered: function(aircraft){
            if(this.isActive && aircraft.species !== null && this.value1){
                var f = true;
                var s = aircraft.species.substr(0,1);
                switch(this.value1){
                    case Filter.Species.LandPlane:
                        if(s === 'L') f = false;
                        break;
                    case Filter.Species.SeaPlane:
                        if(s === 'S') f = false;
                        break; 
                    case Filter.Species.Amphibian:
                        if(s === 'A') f = false;
                        break;                            
                    case Filter.Species.Helicopter:
                        if(s === 'H') f = false;
                        break;                     
                    case Filter.Species.Gyrocopter:
                        if(s === 'G') f = false;
                        break;                     
                    case Filter.Species.Tiltwing:
                        if(s === 'T') f = false;
                        break;
                    default:
                        break;
                }
                if(this.condition === Filter.Condition.NotEquals) f = !f;
                return f;
            }
            return false;                 
        },
        validate: function(){
            this.value1 = Number(this.value1);
            if(this.value1 < Filter.Species.None)
                this.value1 = Filter.Species.None;
            if(this.value1 > Filter.Species.Tower)
                this.value1 = Filter.Species.Tower;
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Squawk] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Squawk,
        type: Filter.FilterType.NumberRange,
        label: 'Squawk',
        minimumValue: 0,
        maximumValue: 7777,
        decimalPlaces: 0,
        inputWidth: Filter.InputWidth.SixChar,
        condition: Filter.Condition.Between,
        getFilterConditions: [Filter.Condition.Between, Filter.Condition.NotBetween],
        isFiltered: function(aircraft){
            if(this.isActive && this.value1 !== undefined && this.value2 !== undefined){
                if(aircraft.squawk === null) return true;
                var f = true;
                var s = Number(aircraft.squawk);
                if(s >= this.value1 && s <= this.value2) f = false;
                if(this.condition === Filter.Condition.NotBetween) f = !f;
                return f;                
            }
            return false; 
        },
        validate: function(){
            this.value1 = Filter.validateNumber(this.value1, this.minimumValue, this.maximumValue);
            this.value2 = Filter.validateNumber(this.value2, this.minimumValue, this.maximumValue);
        }
    });
    
    Filter.aircraftFilterHandlers[Filter.AircraftFilter.Wtc] = new Filter.AircraftFilterHandler({
        property: Filter.AircraftFilter.Wtc,
        type: Filter.FilterType.EnumMatch,
        label: 'Wake Turbulence',
        condition: Filter.Condition.Equals,
        getFilterConditions: [Filter.Condition.Equals, Filter.Condition.NotEquals],
        getEnumValues: 
            [
                new Filter.ValueText({ value: Filter.WakeTurbulenceCategory.None, text: 'None' }),
                new Filter.ValueText({ value: Filter.WakeTurbulenceCategory.Light, text: 'Light' }),
                new Filter.ValueText({ value: Filter.WakeTurbulenceCategory.Medium, text: 'Medium' }),
                new Filter.ValueText({ value: Filter.WakeTurbulenceCategory.Heavy, text: 'Heavy' })
            ],
        isFiltered: function(aircraft){
            if(this.isActive && aircraft.wtc !== null && this.value1){
                var f = true;
                switch(this.value1){
                    case Filter.WakeTurbulenceCategory.Light:
                        if(aircraft.wtc === 'L') f = false;
                        break;
                    case Filter.WakeTurbulenceCategory.Medium:
                        if(aircraft.wtc === 'M') f = false;
                        break;
                    case Filter.WakeTurbulenceCategory.Heavy:
                        if(aircraft.wtc === 'H') f = false;
                        break;
                    default:
                        f = false;
                        break;
                }
                if(this.condition === Filter.Condition.NotEquals) f = !f;
                return f;
            }
            return false; 
        },
        validate: function(){
            this.value1 = Number(this.value1);
            if(this.value1 < Filter.WakeTurbulenceCategory.None)
                this.value1 = Filter.WakeTurbulenceCategory.None;
            if(this.value1 > Filter.WakeTurbulenceCategory.Heavy)
                this.value1 = Filter.WakeTurbulenceCategory.Heavy;
        }
    });
  
})(Filter || (Filter = {}));

/* Validate a number from user input */
Filter.validateNumber = function(value, min, max){
    var v = Number(value);
    if(!Number.isFinite(v)) v = min;
    if(v < min)
        v = min;
    if(v > max)
        v = max;
    return v;
};

/* Filter a text input depending on condition */
Filter.filterText = function(haystack, needle, condition){
    if(needle === undefined) return false;
    if(haystack === null) return true;
    var h = haystack.trim().toUpperCase();
    var n = needle.trim().toUpperCase();
    switch(condition){    
        case Filter.Condition.Equals:
            if(h === n) return false;
            break;
            
        case Filter.Condition.NotEquals:
            if(h !== n) return false;
            break;
        
        case Filter.Condition.Contains:
            if(h.search(n) !== -1) return false;
            break;
            
        case Filter.Condition.NotContains:
            if(h.search(n) === -1) return false;
            break;
            
        case Filter.Condition.Starts:
            return !h.startsWith(n);

        case Filter.Condition.NotStarts:
            return h.startsWith(n);

        case Filter.Condition.Ends:
            return !h.endsWith(n);

        case Filter.Condition.NotEnds:
            return h.endsWith(n);

        default:
            break;
    }
    return true;
};

/* Initialize dump1090 filters */
function initializeFilters() {
    for(var key in Filter.aircraftFilterHandlers){
        var m = "<option value=\""+key+"\">"+Filter.aircraftFilterHandlers[key].label+"</option>\n";
        $("#filter_selector").append(m);
    }
   
    $("#enable_filter_checkbox").checkboxradio({ icon: false });
    $("#enable_filter_checkbox").prop('checked', Filter.isEnabled).checkboxradio("refresh");
    $("#enable_filter_checkbox").on("change", function(){
        Filter.isEnabled = $(this).prop('checked');
        Dump1090DB.indexedDB.putSetting("FilterIsEnabled", Filter.isEnabled);
        // Refresh screen
        refreshTableInfo();
        refreshSelected();
    });

    $("#enable_highlight_checkbox").checkboxradio({ icon: false });
    $("#enable_highlight_checkbox").prop('checked', Filter.isHighlight).checkboxradio("refresh");
    $("#enable_highlight_checkbox").on("change", function(){
        Filter.isHighlight = $(this).prop('checked');
        Dump1090DB.indexedDB.putSetting("FilterIsHighlight", Filter.isHighlight);
        // Refresh screen
        refreshTableInfo();
        refreshSelected();
    });
    $("#filter_add_button").on("click", onFilterAddClick);
    $("#filter_selector").on( "selectmenuclose", onFilterSelectorClose );
};

/* Add new filter */
function onFilterAddClick(e) {
    var key = $("#filter_selector").val();
    addFilterListEntry(key, null, "", "");
};    

/* Add new filter entry to the list */
function addFilterListEntry(key, condition, v1, v2){
    var filterHandler = Filter.aircraftFilterHandlers[key];
    $("#filter_list").append("<li></li>");
    var filterListEntry = $( "#filter_list li:last-of-type" );
    
    filterListEntry.append('<span class="short">'+filterHandler.label+'</span>');
    /* Create condition list*/
    var l = filterHandler.getFilterConditions.length;
    if(l > 0){
        filterListEntry.append('<select id="filter_condition"></select>');
        var c = filterListEntry.children("select:first-of-type");
        for(var i = 0; i < l; i++){
            var x = filterHandler.getFilterConditions[i];
            c.append('<option value="'+Filter.ConditionList[x].value+'">'+Filter.ConditionList[x].text+'</option>');
        }
        if(condition !== null)
            c.val(condition);
        else
            c.val(filterHandler.condition);
    }
    
    /* Create input mask depending on filter type */
    switch(filterHandler.type){
        case Filter.FilterType.OnOff:
            if(v1 === true) v1 = "checked";
            filterListEntry.append('<input type="checkbox" id="input_checked" '+ v1 +'>');
            break;
        case Filter.FilterType.TextMatch:
            filterListEntry.append('<input type="text" id="input_value1" class="'+filterHandler.inputWidth+'" value="'+ v1 +'">');
            break;
        case Filter.FilterType.NumberRange:
            filterListEntry.append('<input type="text" id="input_value1" class="'+filterHandler.inputWidth+'" value="'+ v1 +'">');
            filterListEntry.append(' and ');
            filterListEntry.append('<input type="text" id="input_value2" class="'+filterHandler.inputWidth+'" value="'+ v2 +'">');
            if(key === Filter.AircraftFilter.Distance){
                filterListEntry.append('<span id="dist_unit" class="unit">'+get_unit_label("distance", DisplayUnits)+'</span>');
            }
            else if(key === Filter.AircraftFilter.Altitude){
                filterListEntry.append('<span id="alt_unit" class="unit">'+get_unit_label("altitude", DisplayUnits)+'</span>');
            }
            break;
        case Filter.FilterType.EnumMatch:
            filterListEntry.append('<select id="input_value1" value="'+ v1 +'"></select>');
            l = filterHandler.getEnumValues.length;
            c = filterListEntry.children("select:last-of-type");
            for(i = 0; i < l; i++){
                c.append('<option value="'+filterHandler.getEnumValues[i].value+'">'+filterHandler.getEnumValues[i].text+'</option>');
            }
            if(v1 !== null)
                c.val(v1);
            break;            
        default:
            break;
    }
    
    filterListEntry.append('<button class="ui-button ui-widget ui-corner-all ui-button-icon-only" title="Remove" role="button" value="'+key+'">'+
                           '<span class="ui-icon ui-icon-trash"></span>'+
                           '</button>');
    filterHandler.isActive = true;
    $("#filter_add_button").button( "option", "disabled", true );
    $("#filter_list, input").on("change", onFilterChange);
    $('#filter_list button:last-of-type').on("click", onFilterRemove);
};

/* Prevent adding a filter that is already in the list */
function onFilterSelectorClose(e){
    /* Each filter can be added only once */
    var filterHandler = Filter.aircraftFilterHandlers[e.target.value];    
    if(filterHandler.isActive === true) {
        $("#filter_add_button").button( "option", "disabled", true );
    } else {
        $("#filter_add_button").button( "option", "disabled", false );
    }
};

/* Remove filter from list */
function onFilterRemove(e){
    /* Enable filter again when removed from list */
    Filter.aircraftFilterHandlers[e.target.value].isActive = false;
    if($("#filter_selector").val() === e.target.value){
        $("#filter_add_button").button( "option", "disabled", false );
    }
    e.target.parentNode.remove();
    Dump1090DB.indexedDB.deleteSetting(e.target.value);
    // Refresh screen
    refreshTableInfo();
    refreshSelected();
}

/* Validate inputs and update filter list on user input */
function onFilterChange(e){
    /* Check validity of filter values and save them */
    var id = e.target.id;
    var filterHandler = Filter.aircraftFilterHandlers[e.target.parentNode.lastChild.value];

    switch(id){
        case "filter_condition":
            filterHandler.condition = Number(e.target.value);
            break;
        case "input_checked":
            filterHandler.value1 = e.target.checked;
            filterHandler.validate();
            e.target.checked = filterHandler.value1;
            break;
        case "input_value1":
            filterHandler.value1 = e.target.value;
            filterHandler.validate();
            e.target.value = filterHandler.value1;
            break;
        case "input_value2":
            filterHandler.value2 = e.target.value;
            filterHandler.validate();
            e.target.value = filterHandler.value2;
            break;
        default:
            break;
    }
    
    /* Save filter settings to indexedDB */
    if(filterHandler !== undefined){
        var f = {
            key: filterHandler.property,
            isActive: filterHandler.isActive,
            condition: filterHandler.condition,
            value1: filterHandler.value1,
            value2: filterHandler.value2
        };
        Dump1090DB.indexedDB.putSetting(filterHandler.property, f);
    }
    // Refresh screen
    refreshTableInfo();
    refreshSelected();
}

/* Refresh filter list on display units change */
function refreshFilterList(){
    $("#filter_list li").each(function(){
        $(this).children("#alt_unit").text(get_unit_label("altitude", DisplayUnits));
        $(this).children("#dist_unit").text(get_unit_label("distance", DisplayUnits));
        var f = $(this).children(":button").val();
        if(f === Filter.AircraftFilter.Altitude || f === Filter.AircraftFilter.Distance){
            var filterHandler = Filter.aircraftFilterHandlers[f];
            $(this).children("#input_value1").val(filterHandler.value1.toFixed(filterHandler.decimalPlaces));
            $(this).children("#input_value2").val(filterHandler.value2.toFixed(filterHandler.decimalPlaces));
        }
    });    
}

/* Restore filters from last session */
function restoreSessionFilters(){
    for(var key in Filter.AircraftFilter){
        var v = Filter.AircraftFilter[key];
        Dump1090DB.indexedDB.getSetting(v)
        .done( function(result){
            var filterHandler = Filter.aircraftFilterHandlers[result.key];
            if(result.condition !== undefined){
                filterHandler.condition = result.condition;
            }
            if(result.isActive !== undefined){
                filterHandler.isActive = result.isActive;
            }
            if(result.value1 !== undefined){
                filterHandler.value1 = result.value1;
            }
            if(result.value2 !== undefined){
                filterHandler.value2 = result.value2;
            }
            addFilterListEntry(result.key, filterHandler.condition, filterHandler.value1, filterHandler.value2);
        });
    }
};