document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('screen');
    const ctx = canvas.getContext('2d');
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let isDrawing = false;
    let lastAngle = {};
    let isDragging = false;
    let dragStartX, dragStartY;
    let lineHistory = [];

    function setupCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
    }

    setupCanvas();

    function drawLine(direction, amount) {
        if (!isDrawing) return;

        ctx.beginPath();
        ctx.moveTo(x, y);

        if (direction === 'horizontal') x += amount;
        else if (direction === 'vertical') y += amount;

        ctx.lineTo(x, y);
        ctx.stroke();

        // Save the line segment
        lineHistory.push({x1: x, y1: y, x2: x + amount, y2: y + amount});
    }

    function redrawLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        lineHistory.forEach(segment => {
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
        });
        ctx.stroke();
    }

    function drawNeedlePoint(nx, ny) {
        const needleRadius = 1;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(nx, ny, needleRadius, 0, 2 * Math.PI);
        ctx.fill();
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

        dial.addEventListener('touchstart', () => {
            isDrawing = true;
        });
        dial.addEventListener('touchend', () => isDrawing = false);
        dial.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const touch = e.targetTouches[0];
            handleDialMovement(e.target, touch.clientX, touch.clientY);
        });
    });

    // Draggable functionality for Etch A Sketch
    const etchASketch = document.getElementById('etchASketch');
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

            // Reset canvas after "shaking"
            lineHistory = []; // Clear the line history
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
            setupCanvas();
        }
    });

    function onMouseMove(e) {
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            etchASketch.style.transform = `translate(${dx}px, ${dy}px)`;

            // Fading effect while moving
            ctx.globalAlpha = 0.9;
            redrawLines();
            ctx.globalAlpha = 1.0; // Reset alpha
        }
    }
});
