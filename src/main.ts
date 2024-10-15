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
let cursor = { active: false, x: 0, y: 0 }
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

    //canvas.style.cursor = "none";

    ctx.fillStyle = '#FFFFFF'
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    SetupEventsAndButtons();
}

function SetupEventsAndButtons() {

    let actions: (DisplayLineCmd | DisplayEmojiCmd)[] = [];
    let currentAction: DisplayLineCmd | DisplayEmojiCmd;
    let redoActions: (DisplayLineCmd | DisplayEmojiCmd | ClearCmd)[] = [];
    let OnDrawingChanged = new Event("drawing-changed");
    let currentPenWeight: number = 5;
    let OnToolMoved = new Event('tool-moved');
    let toolSelected: number = 0;
    let tools = [
        "∘︎",
        "🐹",
        "👆",
        "💍"
    ]

    class DisplayLineCmd {
        readonly startPoint: { x: number, y: number };
        line: { x: number, y: number }[] = [];
        readonly weight: number;

        constructor() {
            this.weight = currentPenWeight;
        }

        drag(x: number, y: number) {
            this.line.push({ x, y });
        }

        display(ctx: CanvasRenderingContext2D) {
            if (this.line.length > 1) {
                ctx?.beginPath();
                ctx.lineWidth = this.weight;
                const { x, y } = this.line[0];
                ctx?.moveTo(x, y);
                for (const { x, y } of this.line) {
                    ctx?.lineTo(x, y);
                }
                ctx?.stroke();
            }
        }
    }

    class DisplayEmojiCmd {
        startPoint: { x: number, y: number };
        adjustPoint: { x: number, y: number };
        readonly weight: number;
        readonly emojiType: number;

        constructor(x: number, y: number) {
            this.weight = currentPenWeight;
            this.startPoint = { x, y };
            this.adjustPoint = this.startPoint;
            this.emojiType = toolSelected;
        }

        drag(x: number, y: number) {
            this.adjustPoint = { x, y };
        }

        display(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#000000'
            ctx.font = `${currentPenWeight * 4}px monospace`;
            ctx.fillText(`${tools[this.emojiType]}`, this.adjustPoint.x - currentPenWeight / 1.1, this.adjustPoint.y + currentPenWeight);
        }
    }

    class DrawCursorCmd {
        display(x: number, y: number) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#000000'
            ctx.font = `${currentPenWeight * 4}px monospace`;
            ctx.fillText(`${tools[toolSelected]}`, x - currentPenWeight / 1.1, y + currentPenWeight);
            ctx.globalAlpha = 1;
        }
    }

    class ClearCmd { // keep a record of the entire screen when cleared so it can be redo'ed
        actions: (DisplayLineCmd | DisplayEmojiCmd)[] = [];
    }

    let cursorCmd = new DrawCursorCmd();

    canvas.addEventListener('drawing-changed', () => {
        ctx.fillStyle = '#FFFFFF'
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        actions.forEach((cmd) => {
            cmd.display(ctx);
        })
    })

    canvas.addEventListener('tool-moved', () => {
        if (!cursor.active) {
            cursorCmd.display(cursor.x, cursor.y);
        }
    })

    canvas.addEventListener('mousedown', (e) => {
        cursor.active = true;

        if (toolSelected == 0) currentAction = new DisplayLineCmd();
        else currentAction = new DisplayEmojiCmd(e.offsetX, e.offsetY);
        currentAction.drag(e.offsetX, e.offsetY);
        redoActions.length = 0;
        actions.push(currentAction);
        canvas.dispatchEvent(OnDrawingChanged);
    })

    canvas.addEventListener('mousemove', (e) => {
        if (cursor.active) {
            currentAction.drag(e.offsetX, e.offsetY);
            canvas.dispatchEvent(OnDrawingChanged);
        } else {
            cursor.x = e.offsetX;
            cursor.y = e.offsetY;
            canvas.dispatchEvent(OnDrawingChanged);
            canvas.dispatchEvent(OnToolMoved);
        }
    })

    canvas.addEventListener('mouseup', () => {
        cursor.active = false;
    })

    const clearButton = app.appendChild(document.createElement('button'));
    clearButton.innerHTML = "clear";
    clearButton.addEventListener('click', () => {
        ctx.fillStyle = '#FFFFFF'
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        let clearScreen = new ClearCmd();
        clearScreen.actions = actions.splice(0);
        redoActions.push(clearScreen);
        actions.length = 0;
    });

    const undoButton = app.appendChild(document.createElement('button'));
    undoButton.innerHTML = "undo";
    undoButton.addEventListener('click', () => {
        if (actions.length > 0) {
            let line = actions.pop();
            if (line) redoActions.push(line);
            canvas.dispatchEvent(OnDrawingChanged);
        }
    })

    const redoButton = app.appendChild(document.createElement('button'));
    redoButton.innerHTML = "redo";
    redoButton.addEventListener('click', () => {
        if (redoActions.length > 0) {
            let action = redoActions.pop();
            if (action) {
                if (action instanceof DisplayLineCmd || action instanceof DisplayEmojiCmd) {
                    actions.push(action);
                } else if (action instanceof ClearCmd) {
                    action.actions.forEach(element => {
                        actions.push(element);
                    });
                }
            }
            canvas.dispatchEvent(OnDrawingChanged);
        }
    })

    app.appendChild(document.createElement('br'));

    const penWeightText = app.appendChild(document.createElement('div'));
    penWeightText.setAttribute('style', 'margin-top:15px;')
    penWeightText.innerHTML = "Pen Weight";

    const penWeight = app.appendChild(document.createElement('input'));
    penWeight.type = 'range';
    penWeight.min = '1';
    penWeight.max = '10';
    penWeight.value = currentPenWeight.toString();
    penWeight.addEventListener('input', () => {
        currentPenWeight = Number(penWeight.value);
    })

    app.appendChild(document.createElement('br'));

    const penType = app.appendChild(document.createElement('div'));
    penType.setAttribute('style', 'margin-top:15px;')
    penType.innerHTML = "Pen Type";

    for (let i = 0; i < tools.length; i++) {
        const toolButton = app.appendChild(document.createElement('button'));
        toolButton.innerHTML = tools[i];
        toolButton.addEventListener('click', () => {
            toolSelected = i;
        })
    }
    app.appendChild(document.createElement('br'));
    const customButton = app.appendChild(document.createElement('button'));
    customButton.innerHTML = "Custom";
    customButton.addEventListener('click', () => {
        let sticker = prompt("Give an emoji");
        if (sticker) {
            const toolButton = app.appendChild(document.createElement('button'));
            tools.push(sticker);
            toolButton.innerHTML = sticker;
            toolSelected = tools.length-1;
            toolButton.addEventListener('click', () => {
                toolSelected = tools.length-1;
            })
        }
    })
}

main();
