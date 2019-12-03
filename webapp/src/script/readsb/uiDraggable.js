"use strict";
var READSB;
(function (READSB) {
    class Draggable {
        constructor(element) {
            this.pos1 = 0;
            this.pos2 = 0;
            this.pos3 = 0;
            this.pos4 = 0;
            this.element = null;
            this.element = element;
            this.element.onmousedown = this.dragMouseDown.bind(this);
        }
        dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;
            document.onmouseup = this.closeDragElement.bind(this);
            document.onmousemove = this.elementDrag.bind(this);
        }
        elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            this.pos1 = this.pos3 - e.clientX;
            this.pos2 = this.pos4 - e.clientY;
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;
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
        closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    READSB.Draggable = Draggable;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiDraggable.js.map