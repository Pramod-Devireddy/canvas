const defaultSquareColor = '#3D368F'
const squareSize = 16
const squareMargin = 49
const gradientColors = []
const updateColorDistanceThreshold = 400
const colorStopResolution = 100

let columnCount
let rowCount
let geoMap = []
let scale = window.devicePixelRatio || 1
let safeArea
let finishedDrawing = false
scale = parseInt(scale)


initCanvas(document.querySelector('.site-hero-canvas'));


function initCanvas (canvas) {
    const ctx = canvas.getContext('2d')

    setResolution(canvas)

    const gradientWidth = 500;
    var gradient = ctx.createLinearGradient(0, 0, gradientWidth, 0);
    gradient.addColorStop(1 / 6 * 0, '#FA989C');
    gradient.addColorStop(1 / 6 * 1, '#F63487');
    gradient.addColorStop(1 / 6 * 2, '#BB2CC1');
    gradient.addColorStop(1 / 6 * 3, '#315BF5');
    gradient.addColorStop(1 / 6 * 4, '#2D9EF4');
    gradient.addColorStop(1 / 6 * 5, '#0BBBA9');
    gradient.addColorStop(1 / 6 * 6, '#D1E876');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gradientWidth, 2);

    for (let i = 0; i < colorStopResolution; i++) {
        const imageData = ctx.getImageData(i * (gradientWidth / colorStopResolution), 1, 1, 1).data;
        gradientColors.push({ r: imageData[0], g: imageData[1], b: imageData[2] });
    }

    drawSquares(canvas);
}


function setResolution (canvas) {
    const ctx = canvas.getContext('2d')
    const clientRect = canvas.getBoundingClientRect()
    finishedDrawing = false
    canvas.width = clientRect.width * scale
    canvas.height = clientRect.height * scale
    columnCount = parseInt(clientRect.width / (squareSize + squareMargin))
    rowCount = parseInt(clientRect.height / (squareSize + squareMargin))

    const offsetX = (clientRect.width - (columnCount * (squareSize + squareMargin) - squareMargin)) / 2
    const offsetY = 10

    geoMap = [];
    for (let x = 0; x < columnCount; x++) {
        let geoRow = [];
        for (let y = 0; y < rowCount; y++) {
            const xPos = offsetX + x * (squareSize + squareMargin);
            const yPos = offsetY + y * (squareSize + squareMargin);

            const geo = {
                opacity: 1,
                x: xPos * scale,
                y: yPos * scale,
                width: squareSize * scale,
                height: squareSize * scale,
                centerX: xPos * scale + squareSize * scale / 2,
                centerY: yPos * scale + squareSize * scale / 2,
            };
            geo.draw = true;
            geoRow.push(geo);
        }
        geoMap.push(geoRow);
    }
}

function drawSquares (canvas) {
    if (finishedDrawing) {
        window.requestAnimationFrame(() => drawSquares(canvas));
        return;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let needsUpdate = false;
    for (let y = 0; y < rowCount; y++) {
        for (let x = 0; x < columnCount; x++) {
            const geo = geoMap[x][y];
            if (geo.draw == false) continue;
            ctx.fillStyle = defaultSquareColor;
            const localScale = 1 + geo.opacity;
            const scaledWidth = geo.width * localScale;
            const scaledHeight = geo.height * localScale;
            const scaleOffset = (scaledWidth - geo.width) / 2;
            ctx.fillRect(geo.x - scaleOffset, geo.y - scaleOffset, scaledWidth, scaledHeight);
            // Draw gradient color if it has a colorTarget above 0.02
            if (geo.opacity > 0.02) {
                needsUpdate = true;
                const colorTarget = parseInt(x / columnCount * colorStopResolution + 0.5);

                const colorData = gradientColors[colorTarget];
                ctx.fillStyle = `rgba(${colorData.r}, ${colorData.g}, ${colorData.b}, ${geo.opacity})`;
                ctx.fillRect(geo.x - scaleOffset, geo.y - scaleOffset, scaledWidth, scaledHeight);
                geo.opacity = geo.opacity * 0.98;
            }
        }
    }
    if (!needsUpdate) finishedDrawing = true;

    window.requestAnimationFrame(() => drawSquares(canvas));
}

function updateColorGoalsFromMousePosition (position) {
    finishedDrawing = false;
    for (let x = 0; x < columnCount; x++) {
        for (let y = 0; y < rowCount; y++) {
            const geo = geoMap[x][y];
            const distanceX = Math.abs(position.x * scale - geo.centerX);
            const distanceY = Math.abs(position.y * scale - geo.centerY);
            const distance = Math.sqrt(distanceY * distanceY + distanceX * distanceX);
            if (distance < updateColorDistanceThreshold) {
                const targetOpacity = 1 - distance / updateColorDistanceThreshold;
                geo.opacity = Math.max(targetOpacity, geo.opacity);
            }
        }
    }
}

function handleMouseMove (e) {
    const canvas = e.target;
    const clientRect = canvas.getBoundingClientRect();
    const localX = e.clientX - clientRect.left;
    const localY = e.clientY - clientRect.top;
    updateColorGoalsFromMousePosition({ x: localX, y: localY });
}

document.querySelector('.site-hero-canvas').addEventListener('mousemove', handleMouseMove);

window.addEventListener('resize', () => {
    setResolution(document.querySelector('.site-hero-canvas'));
});