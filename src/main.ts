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
let cursor = {active: false}
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
    let lines: DisplayLineCmd[] = [];
    let currentLine: DisplayLineCmd;
    let redoLines: DisplayLineCmd[] = [];
    let OnDrawingChanged = new Event("drawing-changed");

    class DisplayLineCmd {
        readonly startPoint: {x: number, y: number};
        line: {x: number, y: number}[] = [];

        drag(x: number, y: number) {
            this.line.push({x, y});
        }

        display(ctx: CanvasRenderingContext2D) {
            if (this.line.length > 1) {
                ctx?.beginPath();
                const {x, y} = this.line[0];
                ctx?.moveTo(x, y);
                for (const {x, y} of this.line) {
                    ctx?.lineTo(x, y);
                }
                ctx?.stroke();
            }
        }
    }

    canvas.addEventListener('drawing-changed', () => {
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        lines.forEach((line) => {
            line.display(ctx);
        })
    })

    canvas.addEventListener('mousedown', (e) => {
        cursor.active = true;

        currentLine = new DisplayLineCmd();
        currentLine.drag(e.offsetX, e.offsetY);
        redoLines.length = 0;
        lines.push(currentLine);
        canvas.dispatchEvent(OnDrawingChanged);
    })

    canvas.addEventListener('mousemove', (e) => {
        if (cursor.active) {
            currentLine.drag(e.offsetX, e.offsetY);
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
        currentLine = new DisplayLineCmd();
        lines.forEach((cmd) => {
            if (cmd.line.length > 0) {
                for (const {x, y} of cmd.line) {
                    currentLine.drag(x, y);
                }
            }
        })
        redoLines.push(currentLine);
        lines.length = 0;
    });

    const undoButton = app.appendChild(document.createElement('button'));
    undoButton.innerHTML = "undo";
    undoButton.addEventListener('click', () => {
        if (lines.length > 0) {
            let line = lines.pop();
            if (line) redoLines.push(line);
            canvas.dispatchEvent(OnDrawingChanged);
        }
    })

    const redoButton = app.appendChild(document.createElement('button'));
    redoButton.innerHTML = "redo";
    redoButton.addEventListener('click', () => {
        if (redoLines.length > 0) {
            let line = redoLines.pop();
            console.log(line);
            if (line) lines.push(line);
            canvas.dispatchEvent(OnDrawingChanged);
        }
    })
}

main();
