import "./style.css";

const APP_NAME = "hey";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;


function SetupPage() {
    const header = document.createElement("div");
    header.setAttribute(
    "style",
    "position:absolute;width:100%;top:0%;text-align: center;-webkit-text-stroke: 2px #aaa676;color:#2f2d12;font-size: 1em;text-shadow: 0px 4.5px 4px #36301f;font-style:italic;font-family:papyrus;",
    );
    document.body.prepend(header);
    const headerText = document.createElement("h1");
    headerText.innerHTML = "Welcome to KidPix";
    headerText.setAttribute("style", "margin-top: 0px; padding-top: 20px;");
    header.append(headerText);  
}

let canvas;
let ctx;
let cursor = {active: false, x: 0, y:0}
function main() {
    SetupPage();

    canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.log('Failed to get context');
        return;
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    SetupEventsAndButtons();
}

function SetupEventsAndButtons() {
    let lines: {x: number, y: number}[][] = [];
    let currentLine: {x: number, y: number}[] = [];
    let OnDrawingChanged = new Event("drawing-changed");

    canvas.addEventListener('drawing-changed', () => {
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        lines.forEach((line) => {
            if (line.length > 1) {
                ctx?.beginPath();
                const {x, y} = line[0];
                ctx?.moveTo(x, y);
                for (const {x, y} of line) {
                    ctx?.lineTo(x, y);
                }
                ctx?.stroke();
            }
        })
    })

    canvas.addEventListener('mousedown', (e) => {
        cursor.active = true;
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;

        currentLine = [];
        lines.push(currentLine);
        currentLine.push({x: cursor.x, y: cursor.y});
        canvas.dispatchEvent(OnDrawingChanged);
    })

    canvas.addEventListener('mousemove', (e) => {
        if (cursor.active) {
            cursor.x = e.offsetX; cursor.y = e.offsetY;
            currentLine.push({x: cursor.x, y: cursor.y});
            canvas.dispatchEvent(OnDrawingChanged);
        }
    })

    canvas.addEventListener('mouseup', () => {
        cursor.active = false;
    })

    const clearButton = app.appendChild(document.createElement('button'));
    clearButton.innerHTML = "clear";
    clearButton.addEventListener('click', () => {
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        lines.length = 0;
    })
}

main();
