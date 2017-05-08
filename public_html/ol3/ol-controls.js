MapControls = function (opt_options) {

    var options = opt_options || {};

    var hideButton = document.createElement('button');
    hideButton.innerHTML = '<span class="ui-icon ui-icon-arrowthickstop-1-e ol-control-button"></span>';
    hideButton.title = "Hide Sidebar";
    hideButton.addEventListener('click', toggleSidebarVisibility, false);
    hideButton.addEventListener('touchstart', toggleSidebarVisibility, false);

    var expandButton = document.createElement('button');
    expandButton.innerHTML = '<span class="ui-icon  ui-icon-arrowthickstop-1-w ol-control-button"></span>';
    expandButton.title = "Expand Sidebar";
    expandButton.addEventListener('click', expandSidebar, false);
    expandButton.addEventListener('touchstart', expandSidebar, false);

    var resetButton = document.createElement('button');
    resetButton.innerHTML = '<span class="ui-icon  ui-icon-arrowreturnthick-1-w ol-control-button"></span>';
    resetButton.title = "Reset Map";
    resetButton.addEventListener('click', resetMap, false);
    resetButton.addEventListener('touchstart', resetMap, false);

    var selectAllButton = document.createElement('button');
    selectAllButton.innerHTML = '<span class="ui-icon  ui-icon-check ol-control-button"></span>';
    selectAllButton.title = "Select All Planes";
    selectAllButton.addEventListener('click', selectAllPlanes, false);
    selectAllButton.addEventListener('touchstart', selectAllPlanes, false);
    
    var selectNoneButton = document.createElement('button');
    selectNoneButton.innerHTML = '<span class="ui-icon  ui-icon-close ol-control-button"></span>';
    selectNoneButton.title = "Deselect All Planes";
    selectNoneButton.addEventListener('click', deselectAllPlanes, false);
    selectNoneButton.addEventListener('touchstart', deselectAllPlanes, false);

    var element = document.createElement('div');
    element.className = 'ol-control-grid ol-unselectable ol-control';
    element.appendChild(hideButton);
    element.appendChild(expandButton);
    element.appendChild(resetButton);
    element.appendChild(selectAllButton);
    element.appendChild(selectNoneButton);
    
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

ol.inherits(MapControls, ol.control.Control);
