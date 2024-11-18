// deno-lint-ignore-file
import "./style.css";

const APP_NAME = "chance odyssey";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

function SetupPage() {
  const header = document.createElement("div");
  header.setAttribute(
    "style",
    "position:absolute;padding-left:50px;width:100%;top:0%;text-align: center;-webkit-text-stroke: 2px #aaa676;color:#2f2d12;font-size: 1em;text-shadow: 0px 4.5px 4px #36301f;font-style:italic;font-family:papyrus;",
  );
  document.body.prepend(header);
  const headerText = document.createElement("h1");
  headerText.innerHTML = "Welcome to KidPix";
  headerText.setAttribute("style", "margin-top: 0px; padding-top: 20px;");
  header.append(headerText);
}

let canvas: HTMLCanvasElement | null;
let ctx: CanvasRenderingContext2D | null;
const cursor = { active: false, leftscreen: false, x: 0, y: 0 };

const EXPORT_SIZE = 1024;

function main() {
  SetupPage();

  canvas = document.querySelector<HTMLCanvasElement>("canvas");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return;
  }

  ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("Failed to get context");
    return;
  }

  SetupContext(ctx);

  canvas.style.cursor = "none";

  SetupEventsAndButtons();
}

function SetupContext(ctx: CanvasRenderingContext2D) {
  if (ctx && canvas) {
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function SetupFunctionButtons(
  bttnType: string,
  callback: Function,
): HTMLButtonElement {
  const button = app.appendChild(document.createElement("button"));
  button.innerHTML = bttnType;
  button.addEventListener("click", () => {
    callback();
  });
  return button;
}

function SetupEventsAndButtons() {
  const actions: (DisplayLineCmd | DisplayEmojiCmd)[] = [];
  let currentAction: DisplayLineCmd | DisplayEmojiCmd;
  const redoActions: (DisplayLineCmd | DisplayEmojiCmd | ClearCmd)[] = [];
  const OnDrawingChanged = new Event("drawing-changed");
  let currentPenWeight: number = 5;
  const OnToolMoved = new Event("tool-moved");
  let toolSelected: number = 0;
  const tools = [
    "∘︎",
    "🐹",
    "👆",
    "💍",
    "🐵",
  ];
  let toolRotation: number = 0;

  class DisplayLineCmd {
    line: { x: number; y: number }[] = [];
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
    startPoint: { x: number; y: number };
    adjustPoint: { x: number; y: number };
    readonly weight: number;
    readonly emojiType: number;
    readonly rotation: number;

    constructor(x: number, y: number) {
      this.weight = currentPenWeight;
      this.startPoint = { x, y };
      this.adjustPoint = this.startPoint;
      this.emojiType = toolSelected;
      this.rotation = toolRotation;
    }

    drag(x: number, y: number) {
      this.adjustPoint = { x, y };
    }

    display(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#000000";
      ctx.translate(this.adjustPoint.x, this.adjustPoint.y);
      ctx.rotate(this.rotation);
      ctx.font = `${this.weight * 4}px monospace`;
      ctx.fillText(`${tools[this.emojiType]}`, -this.weight / 1.1, this.weight);
      ctx.resetTransform();
    }
  }

  class DrawCursorCmd {
    display(x: number, y: number) {
      if (ctx) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#000000";
        ctx.translate(x, y);
        ctx.rotate(toolRotation);
        ctx.font = `${currentPenWeight * 4}px monospace`;
        ctx.fillText(
          `${tools[toolSelected]}`,
          -currentPenWeight / 1.1,
          currentPenWeight,
        );
        ctx.globalAlpha = 1;
        ctx.resetTransform();
      }
    }
  }

  class ClearCmd { // keep a record of the entire screen when cleared so it can be redo'ed
    actions: (DisplayLineCmd | DisplayEmojiCmd)[] = [];
  }

  const cursorCmd = new DrawCursorCmd();

  if (canvas!) {
    canvas.addEventListener("drawing-changed", () => {
      if (ctx!) {
        ctx.fillStyle = "#FFFFFF";
        ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
        actions.forEach((cmd) => {
          cmd.display(ctx!);
        });
      }
    });
  }

  canvas!.addEventListener("tool-moved", () => {
    if (!cursor.active) {
      cursorCmd.display(cursor.x, cursor.y);
    }
  });

  canvas!.addEventListener("mousedown", (e) => {
    cursor.active = true;

    if (toolSelected == 0) currentAction = new DisplayLineCmd();
    else currentAction = new DisplayEmojiCmd(e.offsetX, e.offsetY);
    currentAction.drag(e.offsetX, e.offsetY);
    redoActions.length = 0;
    actions.push(currentAction);
    canvas!.dispatchEvent(OnDrawingChanged);
  });

  canvas!.addEventListener("mousemove", (e) => {
    if (cursor.active) {
      currentAction.drag(e.offsetX, e.offsetY);
      canvas!.dispatchEvent(OnDrawingChanged);
    } else {
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
      canvas!.dispatchEvent(OnDrawingChanged);
      canvas!.dispatchEvent(OnToolMoved);
    }
  });

  app.addEventListener("mouseup", () => {
    cursor.active = false;
  });

  canvas!.addEventListener("mouseenter", (e) => {
    if (cursor.leftscreen && cursor.active) { // left and came back while still holding down
      if (toolSelected == 0) currentAction = new DisplayLineCmd();
      else currentAction = new DisplayEmojiCmd(e.offsetX, e.offsetY);
      currentAction.drag(e.offsetX, e.offsetY);
      redoActions.length = 0;
      actions.push(currentAction);
      canvas!.dispatchEvent(OnDrawingChanged);
    }
    cursor.leftscreen = false;
  });

  canvas!.addEventListener("mouseleave", () => {
    cursor.leftscreen = true;
    canvas!.dispatchEvent(OnDrawingChanged);
  });

  SetupFunctionButtons("clear", () => {
    ctx!.fillStyle = "#FFFFFF";
    ctx?.fillRect(0, 0, canvas!.width, canvas!.height);
    let clearScreen = new ClearCmd();
    clearScreen.actions = actions.splice(0);
    redoActions.push(clearScreen);
    actions.length = 0;
  });

  SetupFunctionButtons("undo", () => {
    if (actions.length > 0) {
      let line = actions.pop();
      if (line) redoActions.push(line);
      canvas!.dispatchEvent(OnDrawingChanged);
    }
  });

  SetupFunctionButtons("redo", () => {
    if (redoActions.length > 0) {
      let action = redoActions.pop();
      if (action) {
        if (
          action instanceof DisplayLineCmd || action instanceof DisplayEmojiCmd
        ) {
          actions.push(action);
        } else if (action instanceof ClearCmd) {
          action.actions.forEach((element) => {
            actions.push(element);
          });
        }
      }
      canvas!.dispatchEvent(OnDrawingChanged);
    }
  });

  SetupFunctionButtons("export", () => {
    let exp_canvas = document.createElement("canvas");
    if (!exp_canvas) {
      console.log("Failed to create canvas for export");
      return;
    }
    exp_canvas.width = EXPORT_SIZE;
    exp_canvas.height = EXPORT_SIZE;

    let exp_ctx = exp_canvas.getContext("2d");
    if (!exp_ctx) {
      console.log("Failed to get context for export");
      return;
    }

    exp_ctx.scale(4, 4);
    exp_ctx.fillStyle = "#FFFFFF";
    exp_ctx.fillRect(0, 0, exp_canvas!.width, exp_canvas!.height);
    actions.forEach((cmd) => {
      cmd.display(exp_ctx);
    });

    const anchor = document.createElement("a");
    anchor.href = exp_canvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  });

  SetupFunctionButtons("change background", () => {
    if (document.body.classList.contains("background-heaven")) {
      document.body.classList.remove("background-heaven");
      document.body.classList.add("background-hell");
    } else {
      document.body.classList.remove("background-hell");
      document.body.classList.add("background-heaven");
    }
  });
  document.body.classList.add("background-heaven");

  app.appendChild(document.createElement("br"));

  const penWeightText = app.appendChild(document.createElement("div"));
  penWeightText.setAttribute("style", "margin-top:15px;");
  penWeightText.innerHTML = "Pen Weight";

  const penWeight = app.appendChild(document.createElement("input"));
  penWeight.type = "range";
  penWeight.min = "1";
  penWeight.max = "10";
  penWeight.step = ".1";
  penWeight.value = currentPenWeight.toString();
  penWeight.addEventListener("input", () => {
    currentPenWeight = Number(penWeight.value);
  });

  const penRotationText = app.appendChild(document.createElement("div"));
  penRotationText.setAttribute("style", "margin-top:0px;");
  penRotationText.innerHTML = "Pen Rotation";

  const penRotation = app.appendChild(document.createElement("input"));
  penRotation.type = "range";
  penRotation.min = "0";
  penRotation.max = "6.2832";
  penRotation.step = ".1";
  penRotation.value = toolRotation.toString();
  penRotation.addEventListener("input", () => {
    toolRotation = Number(penRotation.value);
  });

  app.appendChild(document.createElement("br"));

  const penType = app.appendChild(document.createElement("div"));
  penType.setAttribute("style", "margin-top:15px;");
  penType.innerHTML = "Pen Type";

  for (let i = 0; i < tools.length; i++) {
    const toolButton = app.appendChild(document.createElement("button"));
    toolButton.innerHTML = tools[i];
    toolButton.addEventListener("click", () => {
      toolSelected = i;
    });
  }
  app.appendChild(document.createElement("br"));
  const customButton = app.appendChild(document.createElement("button"));
  customButton.innerHTML = "Custom";
  customButton.addEventListener("click", () => {
    let sticker = prompt("Give an emoji");
    if (sticker) {
      const toolButton = app.appendChild(document.createElement("button"));
      tools.push(sticker);
      toolButton.innerHTML = sticker;
      toolSelected = tools.length - 1;
      toolButton.addEventListener("click", () => {
        toolSelected = tools.length - 1;
      });
    }
  });
}

main();
