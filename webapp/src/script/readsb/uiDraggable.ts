// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiDraggable.ts: Class that makes an HTMLElement draggable within map boundaries.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

namespace READSB {
    /**
     * Make given element draggable within map boundaries.
     */
    export class Draggable {
        private pos1: number = 0;
        private pos2: number = 0;
        private pos3: number = 0;
        private pos4: number = 0;
        private element: HTMLElement = null;

        /**
         * Make new HTML element draggable within document body client area.
         * @param element HTMLElement object
         */
        constructor(element: HTMLElement) {
            this.element = element;
            this.element.onmousedown = this.dragMouseDown.bind(this);
        }

        /**
         * Catch mouse down event and get pointer position.
         * @param e MouseEvent
         */
        private dragMouseDown(e: any) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;
            document.onmouseup = this.closeDragElement.bind(this);
            // call a function whenever the cursor moves:
            document.onmousemove = this.elementDrag.bind(this);
        }

        /**
         * Calculate HTML element position when mouse pointer moves.
         * Element can only moved within document client area.
         * @param e MouseEvent
         */
        private elementDrag(e: any) {
            e = e || window.event;
            e.preventDefault();
            // Calculate the new cursor position.
            this.pos1 = this.pos3 - e.clientX;
            this.pos2 = this.pos4 - e.clientY;
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;
            // Set the element's new position but limit to document client area.
            let posTop = this.element.offsetTop - this.pos2;
            if (posTop < 0) {
                posTop = 0;
            }
            if (posTop + this.element.clientHeight > document.body.clientHeight) {
                posTop = document.body.clientHeight - this.element.clientHeight;
            }
            this.element.style.top = `${posTop}px`;

            let posLeft = this.element.offsetLeft - this.pos1;
            if (posLeft < 0) {
                posLeft = 0;
            }
            if (posLeft + this.element.clientWidth > document.body.clientWidth) {
                posLeft = document.body.clientWidth - this.element.clientWidth;
            }
            this.element.style.left = `${posLeft}px`;
        }

        /**
         * Stop moving when mouse button is released.
         */
        private closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}
