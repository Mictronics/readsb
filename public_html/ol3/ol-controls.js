import './ol.js';
import {
  ToggleSidebarVisibility,
  ExpandSidebar,
  ResetMap,
  SelectAllPlanes,
  DeselectAllPlanes,
} from '../script.js';

class MapControls extends ol.control.Control {
  constructor(options) {
    const opt = options || {};
    const hideButton = document.createElement('button');
    hideButton.innerHTML = '<span class="ui-icon ui-icon-arrowthickstop-1-e ol-control-button"></span>';
    hideButton.title = 'Hide Sidebar';
    hideButton.addEventListener('click', ToggleSidebarVisibility, false);
    hideButton.addEventListener('touchstart', ToggleSidebarVisibility, false);

    const expandButton = document.createElement('button');
    expandButton.innerHTML = '<span class="ui-icon  ui-icon-arrowthickstop-1-w ol-control-button"></span>';
    expandButton.title = 'Expand Sidebar';
    expandButton.addEventListener('click', ExpandSidebar, false);
    expandButton.addEventListener('touchstart', ExpandSidebar, false);

    const resetButton = document.createElement('button');
    resetButton.innerHTML = '<span class="ui-icon  ui-icon-arrowreturnthick-1-w ol-control-button"></span>';
    resetButton.title = 'Reset Map';
    resetButton.addEventListener('click', ResetMap, false);
    resetButton.addEventListener('touchstart', ResetMap, false);

    const selectAllButton = document.createElement('button');
    selectAllButton.innerHTML = '<span class="ui-icon  ui-icon-check ol-control-button"></span>';
    selectAllButton.title = 'Select All Planes';
    selectAllButton.addEventListener('click', SelectAllPlanes, false);
    selectAllButton.addEventListener('touchstart', SelectAllPlanes, false);

    const selectNoneButton = document.createElement('button');
    selectNoneButton.innerHTML = '<span class="ui-icon  ui-icon-close ol-control-button"></span>';
    selectNoneButton.title = 'Deselect All Planes';
    selectNoneButton.addEventListener('click', DeselectAllPlanes, false);
    selectNoneButton.addEventListener('touchstart', DeselectAllPlanes, false);

    const element = document.createElement('div');
    element.className = 'ol-control-grid ol-unselectable ol-control';
    element.appendChild(hideButton);
    element.appendChild(expandButton);
    element.appendChild(resetButton);
    element.appendChild(selectAllButton);
    element.appendChild(selectNoneButton);
    super({
      element,
      target: opt.target,
    });
  }
}

export default MapControls;
