class EtchASketch {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.offscreenCanvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.isDrawing = false;
        this.lastAngle = {};
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.setupCanvas();
        this.attachEventListeners();
    }

    setupCanvas() {
        this.canvas.width = this.offscreenCanvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.offscreenCanvas.height = this.canvas.offsetHeight;
        this.resetStrokeStyle();
        this.ctx.lineWidth = this.offscreenCtx.lineWidth = 1;
        this.ctx.lineCap = this.offscreenCtx.lineCap = 'round';
        this.drawNeedlePoint();
    }

    resetStrokeStyle() {
        this.offscreenCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
        this.offscreenCtx.globalAlpha = 1.0;
    }

    isWithinScreenBounds(newX, newY) {
        const padding = 10;
        return (
            newX >= padding &&
            newX <= this.canvas.width - padding &&
            newY >= padding &&
            newY <= this.canvas.height - padding
        );
    }

    drawLine(direction, amount) {
        if (!this.isDrawing) return;

        let newX = this.x;
        let newY = this.y;

        if (direction === 'horizontal') {
            newX += amount;
        } else if (direction === 'vertical') {
            newY += amount;
        }

        if (this.isWithinScreenBounds(newX, newY)) {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(this.x, this.y);
            this.offscreenCtx.lineTo(newX, newY);
            this.offscreenCtx.stroke();

            this.x = newX;
            this.y = newY;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        this.drawNeedlePoint();
    }

    drawNeedlePoint() {
        const needleRadius = 2;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, needleRadius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    resetCanvasAndNeedle() {
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawNeedlePoint();
    }

    getAngle(cx, cy, ex, ey) {
        const dy = ey - cy;
        const dx = ex - cx;
        return Math.atan2(dy, dx);
    }

    handleDialMovement(dial, clientX, clientY) {
        const rect = dial.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const newAngle = this.getAngle(centerX, centerY, clientX, clientY);
        const dialId = dial.id;

        if (typeof this.lastAngle[dialId] !== 'undefined') {
            const deltaAngle = newAngle - this.lastAngle[dialId];
            const direction = dialId === 'horizontalDial' ? 'horizontal' : 'vertical';
            this.drawLine(direction, Math.sign(deltaAngle) * 2);
        }

        this.lastAngle[dialId] = newAngle;
        dial.style.transform = `rotate(${newAngle}rad)`;
    }

    attachEventListeners() {
        const etchASketchElement = this.canvas.parentElement;
        const dials = document.querySelectorAll('.dial');
        dials.forEach(dial => this.attachDialListeners(dial));
        this.attachEtchASketchListeners(etchASketchElement);
    }

    attachDialListeners(dial) {
        dial.addEventListener('mousedown', () => this.isDrawing = true);
        dial.addEventListener('mouseup', () => this.isDrawing = false);
        dial.addEventListener('mouseleave', () => this.isDrawing = false);
        dial.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            this.handleDialMovement(e.target, e.clientX, e.clientY);
        });
        dial.addEventListener('touchstart', (e) => {
            this.isDrawing = true;
            e.preventDefault();
        });
        dial.addEventListener('touchend', () => this.isDrawing = false);
        dial.addEventListener('touchmove', (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const touch = e.targetTouches[0];
            this.handleDialMovement(e.target, touch.clientX, touch.clientY);
        });
    }

    attachEtchASketchListeners(etchASketchElement) {
        etchASketchElement.addEventListener('mousedown', (e) => this.handleEtchASketchMouseDown(e, etchASketchElement));
        document.addEventListener('mouseup', () => this.handleEtchASketchMouseUp(etchASketchElement));
        document.addEventListener('mousemove', (e) => this.handleEtchASketchMouseMove(e, etchASketchElement));
        etchASketchElement.addEventListener('touchstart', (e) => this.handleEtchASketchTouchStart(e, etchASketchElement));
        document.addEventListener('touchend', () => this.handleEtchASketchTouchEnd(etchASketchElement));
        document.addEventListener('touchmove', (e) => this.handleEtchASketchTouchMove(e, etchASketchElement));
    }

    handleEtchASketchMouseDown(e, etchASketchElement) {
        if (!e.target.classList.contains('dial')) {
            this.isDragging = true;
            this.dragStartX = e.clientX - etchASketchElement.offsetLeft;
            this.dragStartY = e.clientY - etchASketchElement.offsetTop;
            etchASketchElement.style.cursor = 'grabbing';
        }
    }

    handleEtchASketchMouseUp(etchASketchElement) {
        if (this.isDragging) {
            this.isDragging = false;
            etchASketchElement.style.cursor = 'grab';
            etchASketchElement.style.transform = 'translate(0, 0)';
            this.resetCanvasAndNeedle();
        }
    }

    handleEtchASketchMouseMove(e, etchASketchElement) {
        if (this.isDragging) {
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            etchASketchElement.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }

    handleEtchASketchTouchStart(e, etchASketchElement) {
        if (!e.target.classList.contains('dial')) {
            const touch = e.touches[0];
            this.dragStartX = touch.clientX - etchASketchElement.offsetLeft;
            this.dragStartY = touch.clientY - etchASketchElement.offsetTop;
            this.isDragging = true;
        }
    }

    handleEtchASketchTouchEnd(etchASketchElement) {
        if (this.isDragging) {
            this.isDragging = false;
            etchASketchElement.style.transform = 'translate(0, 0)';
            this.resetCanvasAndNeedle();
        }
    }

    handleEtchASketchTouchMove(e, etchASketchElement) {
        if (this.isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.dragStartX;
            const dy = touch.clientY - this.dragStartY;
            etchASketchElement.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('screen');
    new EtchASketch(canvas);
});
