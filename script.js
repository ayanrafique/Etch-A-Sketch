document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('screen');
    const ctx = canvas.getContext('2d');
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let isDrawing = false;
    let lastAngle = {};
    let isDragging = false;
    let dragStartX, dragStartY;

    function setupCanvas() {
        canvas.width = offscreenCanvas.width = canvas.offsetWidth;
        canvas.height = offscreenCanvas.height = canvas.offsetHeight;
        resetStrokeStyle();
        ctx.lineWidth = offscreenCtx.lineWidth = 1;
        ctx.lineCap = offscreenCtx.lineCap = 'round';
        drawNeedlePoint(x, y);  // Draw the initial needle point
    }

    setupCanvas();

    function resetStrokeStyle() {
        offscreenCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
        offscreenCtx.globalAlpha = 1.0;
    }

    function isWithinScreenBounds(newX, newY) {
        const padding = 10;
        return (
            newX >= padding &&
            newX <= canvas.width - padding &&
            newY >= padding &&
            newY <= canvas.height - padding
        );
    }

    function drawLine(direction, amount) {
        if (!isDrawing) return;

        let newX = x;
        let newY = y;

        if (direction === 'horizontal') {
            newX += amount;
        } else if (direction === 'vertical') {
            newY += amount;
        }

        if (isWithinScreenBounds(newX, newY)) {
            offscreenCtx.beginPath();
            offscreenCtx.moveTo(x, y);
            offscreenCtx.lineTo(newX, newY);
            offscreenCtx.stroke();

            x = newX;
            y = newY;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);
        drawNeedlePoint(x, y);
    }

    function drawNeedlePoint(nx, ny) {
        const needleRadius = 2;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(nx, ny, needleRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    function resetCanvasAndNeedle() {
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        x = canvas.width / 2;
        y = canvas.height / 2;
        drawNeedlePoint(x, y);
    }

    function getAngle(cx, cy, ex, ey) {
        const dy = ey - cy;
        const dx = ex - cx;
        return Math.atan2(dy, dx);
    }

    function handleDialMovement(dial, clientX, clientY) {
        const rect = dial.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const newAngle = getAngle(centerX, centerY, clientX, clientY);
        const dialId = dial.id;

        if (typeof lastAngle[dialId] !== 'undefined') {
            const deltaAngle = newAngle - lastAngle[dialId];
            const direction = dialId === 'horizontalDial' ? 'horizontal' : 'vertical';
            drawLine(direction, Math.sign(deltaAngle) * 2);
        }

        lastAngle[dialId] = newAngle;
        dial.style.transform = `rotate(${newAngle}rad)`;
    }

    const dials = document.querySelectorAll('.dial');
    dials.forEach(dial => {
        dial.addEventListener('mousedown', (e) => {
            isDrawing = true;
        });
        dial.addEventListener('mouseup', () => isDrawing = false);
        dial.addEventListener('mouseleave', () => isDrawing = false);
        dial.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            handleDialMovement(e.target, e.clientX, e.clientY);
        });

        dial.addEventListener('touchstart', (e) => {
            isDrawing = true;
            e.preventDefault();
        });
        dial.addEventListener('touchend', () => isDrawing = false);
        dial.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const touch = e.targetTouches[0];
            handleDialMovement(e.target, touch.clientX, touch.clientY);
        });
    });

    etchASketch.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('dial')) {
            isDragging = true;
            dragStartX = e.clientX - etchASketch.offsetLeft;
            dragStartY = e.clientY - etchASketch.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            etchASketch.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            document.removeEventListener('mousemove', onMouseMove);
            isDragging = false;
            etchASketch.style.cursor = 'grab';
            etchASketch.style.transform = 'translate(0, 0)';
            resetCanvasAndNeedle();
        }
    });

    function onMouseMove(e) {
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            etchASketch.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }

    etchASketch.addEventListener('touchstart', (e) => {
        if (!e.target.classList.contains('dial')) {
            const touch = e.touches[0];
            dragStartX = touch.clientX - etchASketch.offsetLeft;
            dragStartY = touch.clientY - etchASketch.offsetTop;
            isDragging = true;
            document.addEventListener('touchmove', onTouchMove);
        }
    });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            document.removeEventListener('touchmove', onTouchMove);
            isDragging = false;
            etchASketch.style.transform = 'translate(0, 0)';
            resetCanvasAndNeedle();
        }
    });

    function onTouchMove(e) {
        if (isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - dragStartX;
            const dy = touch.clientY - dragStartY;
            etchASketch.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }
});
