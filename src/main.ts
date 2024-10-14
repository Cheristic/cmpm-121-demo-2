import "./style.css";

const APP_NAME = "hey";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;



function SetupHeader() {
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

let canvas: HTMLCanvasElement | null;
let ctx: CanvasRenderingContext2D | null;
function main() {
    SetupHeader();
    
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

    console.log(canvas);
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

main();
