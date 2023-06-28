
//Leo Tetris Version 0.1
//http://rozenlab.com/tetris

const idCanvas = "screen";
const canvasWidth = 500;
const canvasHeight = 640;
const gameFieldWidth = 300;
const gameFieldHeight = 600;
const widthCellQuantity = 10;
const heightCellQuantity = 20;
const frameColor = '#000';
const gridColor = '#ddd';
const multicoloredFigures = false;

let mainTetris;
let mainField;
let clueField;
let gameField;
let SoundPlay;

let vibrateOn = true;
let enableGrid = true;
let enableSound = true;
let score = 0;
let hiScore = 0;
let gameSpeed = 1000;
let refreshIntervalId;
let speedLabel = 1;
let speedStep = 100;
let goalStep = 0;
let goalTarget = 10;

const soundVolume = 0.3;
const buttonVibratePattern = 30;

let blockControl = false;
let pause = false;

document.onkeydown = handle;
let ScreenContext = createScreen(idCanvas, canvasWidth, canvasHeight);

//Test params:
const stepMode = false;
const testFigure = 'no'; // 'no', 0-4
const bgFigure = false;
const manualPlace = false;

//https://colorscheme.ru/color-harmony-pastels/color-wheel.html
const palette = [
    '#ec1b24',
    '#ee2c38',
    '#f47115',
    '#f79c0e',
    '#dcd100',
    '#65c42f',
    '#00a65f',
    '#00aaaf',
    '#1b62b7',
    '#293d9b',
    '#542790',
    '#a0138e'
];

function createScreen(idCanvas, canvasWidth, canvasHeight) {
    const canvas = document.getElementById(idCanvas);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    return canvas.getContext('2d');
}

class Field {
    constructor(
        ScreenContext,
        zeroPointOnCanvasX,
        zeroPointOnCanvasY,
        width,
        height,
        widthCellQuantity,
        heightCellQuantity
    ) {
        this.ctx = ScreenContext;
        this.x = zeroPointOnCanvasX;
        this.y = zeroPointOnCanvasY;
        this.width = width;
        this.height = height;
        this.widthCellQuantity = widthCellQuantity;
        this.heightCellQuantity = heightCellQuantity;
        this.pixelWidth = width / widthCellQuantity;
        this.pixelHeight = height / heightCellQuantity;

        this.fX = width / widthCellQuantity - zeroPointOnCanvasX;
        this.fY = height / heightCellQuantity - zeroPointOnCanvasY;
    }

    drawPixel(x, y, color) {
        if(!(x < 1 || y < 1 || x > widthCellQuantity || y > heightCellQuantity)) {
            this.ctx.fillStyle = color;
            this.ctx.fill();

            this.ctx.fillRect(
                this.pixelWidth * x - this.fX,
                this.pixelHeight * y - this.fY,
                this.pixelWidth,
                this.pixelHeight
            );
        }
    }

    drawFigure(x, y, figure, bg, color = '#000') {
        let pixelColor;
        for (let fx = 0; fx < figure[0].length; fx++) {
            for (let fy = 0; fy < figure.length; fy++) {
                if (figure[fy][fx] !== 0) {
                    if (figure[fy][fx] !== 1) {
                        pixelColor = figure[fy][fx];
                    } else pixelColor = color;
                    this.drawPixel (x + fx, y + fy, pixelColor);
                } else {
                    if(bg) {
                        this.drawPixel(x + fx, y + fy, '#eae8e8');
                    }
                }
            }
        }
    }

    mirrorFigure (figure) {
        const mirrorFigure = [];
        for (let y = 0; y < figure.length; y++ ) {
            mirrorFigure[y] = figure[y].reverse();
        }
        return mirrorFigure;
    }

    rotateFigure (figure) {
        let n, m;
        n = m = figure.length;
        let rotatedFigure = [];
        for (let i = 0; i < m; i++){
            rotatedFigure[i] = [];
            for (let j = 0; j < n; j++){
                rotatedFigure[i][j] = 0;
            }}

        for (let y = 0; y < figure.length; y++) {
            for (let x = 0; x < figure[y].length; x++) {
                rotatedFigure[x][figure.length - 1 - y] = figure[y][x];
            }
        }
        return rotatedFigure;
    }

    figureColoring(figure, color = '#000') {
        let pixelColor;
        for (let x = 0; x < figure[0].length; x++) {
            for (let y = 0; y < figure.length; y++) {
                if (figure[y][x] !== 0) {
                    if(color === 'random') {
                        pixelColor = randomStaticColor(palette);
                    } else pixelColor = color;
                    figure[y][x] = pixelColor;
                }
            }
        }
        return figure;
    }

    drawLine(x, y, toX, toY, color) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(this.x + 0.5 + x,this.y + y + 0.5);
        this.ctx.lineTo(this.x + 0.5 + toX,this.y + toY + 0.5);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawGrid(color) {
        if(enableGrid === true) {
            for (let x = 0; x <= this.heightCellQuantity - 1; x++) {
                this.drawLine(
                    0,
                    this.pixelHeight + x * this.pixelHeight,
                    this.width,
                    this.pixelHeight + x * this.pixelHeight,
                    color
                );
            }

            for (let y = 0; y < this.widthCellQuantity; y++) {
                this.drawLine(
                    this.pixelWidth + y * this.pixelWidth,
                    this.height,
                    this.pixelWidth + y * this.pixelWidth,
                    0,
                    color
                );
            }
        }
    }

    drawFrame(color, lineWidth = 1) {
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    drawText(text, size, x, y) {
        this.ctx.fillStyle = '#3636a5';
        this.ctx.font = size + "px digital-7-italic";
        this.ctx.fillText(text, x, y);
    }

    clearScreen() {
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
}

function randomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

function randomStaticColor(palette) {
    let colors = [];
    if(palette === undefined) { //Default palette
        colors = ['Fuchsia', 'Purple', 'Red', 'Maroon', 'Yellow', 'Olive', 'Lime', 'Green', 'Blue', 'Navy'];
    } else colors = palette;
    return colors[randomInteger(0, colors.length - 1)];
}

class Tetris {
    screenMatrix = [];

    I = [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ];

    L = [ //+mirror
        [0,0,0,0],
        [0,0,1,0],
        [1,1,1,0],
        [0,0,0,0]
    ];

    O = [
        [0,0,0,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0]
    ];

    T = [
        [0,0,0,0],
        [0,1,0,0],
        [1,1,1,0],
        [0,0,0,0]
    ];

    Z = [ //+mirror
        [0,0,0,0],
        [1,1,0,0],
        [0,1,1,0],
        [0,0,0,0]
    ];

    figures = [this.I, this.L, this.O, this.T, this.Z];

    releasePoint = {  //!!!!!!!!!!!
        x: 4,
        y: 0
    };

    activeFigure = {
        buffer: [],
        x: 0,
        y: 0
    };

    emptyField = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    constructor() {
        this.screenMatrix = this.emptyField;
        this.nextFigure = this.createFigure(this.figures);
        this.createActiveFigure();
        this.nextFigure = this.createFigure(this.figures);
    }

    createFigure(figures) {
        let figure = figures[randomInteger(0, figures.length - 1)];

        if(testFigure !== 'no') {
            figure = figures[testFigure];
        }

        if(randomInteger(0, 1) === 1) {
            figure = mainField.mirrorFigure(figure);
        }

        const figureRotation = randomInteger(0, 3);
        for (let i = 0; i < figureRotation; i++) {
            figure = mainField.rotateFigure(figure);
        }

        const color = multicoloredFigures ? 'random' : randomStaticColor(palette);

        return mainField.figureColoring(figure, color);
    }

    createActiveFigure() {
        this.activeFigure.buffer = this.nextFigure;
        this.activeFigure.status = 1;
    }

    placeFigure(field, figure, x, y, mode = 's') {
        let pixelColor;
        for (let fx = 0; fx < figure[0].length; fx++) {
            for (let fy = 0; fy < figure.length; fy++) {
                if (figure[fy][fx] !== 0) {
                    if (figure[fy][fx] !== 1) {
                        pixelColor = figure[fy][fx];
                    } else pixelColor = color;

                    if(mode === 's') {
                        field[y + fy - 1][x + fx + 3] = figure[fy][fx]; //for S or Auto
                    }

                    if(mode === 'a') {
                        field[y + fy][x + fx + 3] = figure[fy][fx]; //for A
                    }

                    if(mode === 'd') {
                        field[y + fy][x + fx + 1] = figure[fy][fx]; //for D
                    }
                }
            }
        }
        return field;
    }

    rowsDeleter(field) {
        let pixelCounter = 0;
        const emptyRow = new Array (widthCellQuantity).fill(0);

        for (let fy = 0; fy < field.length; fy++) {
            for (let fx = 0; fx < field[0].length; fx++) {
                if (field[fy][fx] !== 0) {
                    pixelCounter++;
                }
            }

            if(pixelCounter === widthCellQuantity) {
                let fieldCleaned = field.slice();
                fieldCleaned.splice(fy, 1);
                fieldCleaned.splice(0, 0, emptyRow);
                return fieldCleaned;
            }
            pixelCounter = 0;
        }
        return false;
    }

    checkCollision(figure, x, y, field) {
        field[-1] = new Array (widthCellQuantity).fill(0);
        for (let fy = 0; fy < figure.length; fy++) {
            for (let fx = 0; fx < figure[0].length; fx++) {
                if (figure[fy][fx] !== 0) {
                    if((y + fy) > heightCellQuantity) {
                        //console.log('bottom');
                        return "bottom";
                    }

                    if((x + fx) < -3) {
                       //console.log('wallL');
                        return "wallL";
                    }

                    if((x + fx) > widthCellQuantity - 4) {
                        //console.log('wallR');
                        return "wallR";
                    }

                    if (field[y + fy - 1][x + fx + 3] !== 0) {
                        //console.log('field');
                        return "field";
                    }
                }
            }
        }
    }

    endFigureEvent(mode, key = false) {
        let f; // 0 - for dev only E key. For game: 1
        if(key === true) {
            f = 0;
        } else  f = 1;

        this.screenMatrix = this.placeFigure(
            this.screenMatrix,
            this.activeFigure.buffer,
            this.activeFigure.x,
            this.activeFigure.y - f,
            mode
        );

        let cleanedField;
        for(let i = 0; i < heightCellQuantity; i++) {
            cleanedField = this.rowsDeleter(this.screenMatrix);
            if(cleanedField !== false) {
                this.screenMatrix = cleanedField;
                score += 100; //Добавить бонусы за несколько рядов за раз. 2 ряда: +100, ...
                goalStep++;

                SoundPlay.playSound15(); //Deleting row

                if(goalStep === goalTarget) {
                    goalStep = 0;
                    speedLabel++;
                    gameSpeed -= speedStep;

                    clearInterval(refreshIntervalId);
                    refreshIntervalId = setInterval(main, gameSpeed);

                    SoundPlay.playSound4(); //Goal
                }

            } else break;
        }

        this.createActiveFigure();
        this.nextFigure = this.createFigure(this.figures);

        this.activeFigure.x = 0;
        this.activeFigure.y = 0;

        SoundPlay.playSound13();

        clearInterval(mainTetris.quickKeyInterval);

    }

    vibrate(pattern) {
        if(vibrateOn) {
            window.navigator.vibrate(pattern);
        }
    }

    //------------------------------------------------------------------------------------------------------------------
    //Control
    leftKey(silent = false) {
        const mode = 'a';
        if(!blockControl) {
            this.activeFigure.x--;
            main(mode,true);
            if(!silent) {
                SoundPlay.playSound14();
                this.vibrate(buttonVibratePattern);
            }
        }
    }

    rightKey(silent = false) {
        const mode = 'd';
        if(!blockControl) {
            this.activeFigure.x++;
            main(mode,true);
            if(!silent) {
                SoundPlay.playSound14();
                this.vibrate(buttonVibratePattern);
            }
        }
    }

    quickKey() {
        let mode;
        if(!blockControl) {
            clearInterval(this.quickKeyInterval);
            this.quickKeyInterval = setInterval(() => {
                this.activeFigure.y++;
                main(mode,true);
            },1);
            SoundPlay.playSound14();
            this.vibrate(buttonVibratePattern);
        }
    }

    downKey(silent = false) {
        let mode;
        if(!blockControl) {
            this.activeFigure.y++;
            main(mode,true);
            if(!silent) {
                SoundPlay.playSound14();
                this.vibrate(buttonVibratePattern);
            }
        }
    }

    rotateKey() {
        let mode;
        if(!blockControl) {
            this.activeFigure.buffer = mainField.rotateFigure(this.activeFigure.buffer);
            main(mode,true);

            SoundPlay.playSound5();
            this.vibrate(buttonVibratePattern);
        }
    }

    pauseKey() {
        let mode;
        if(pause) {
            refreshIntervalId = setInterval(main, gameSpeed);
            blockControl = false;
            pause = false;
            SoundPlay.playSound2();
            this.vibrate(buttonVibratePattern);
        } else {
            clearInterval(refreshIntervalId);
            blockControl = true;
            pause = true;
            mainTetris.drawPause();
            SoundPlay.playSound1();
            this.vibrate(buttonVibratePattern);
        }
        main(mode,true);
    }

    muteSoundKey() {
        if(!pause) {
            let mode;
            //enableSound = !enableSound;

            if (enableSound) {
                SoundPlay.playSound1();
                this.vibrate(buttonVibratePattern);
                enableSound = false;
            } else {
                enableSound = true;
                SoundPlay.playSound2();
                this.vibrate(buttonVibratePattern);
            }

            main(mode, true);
        }
    }

    newGameKey() {
        let mode;
        newGameTetris();
        main(mode,true);
        SoundPlay.playSound14();
        this.vibrate(buttonVibratePattern);
    }

    stepModeKey() {
        if(stepMode) {
            if (!blockControl) {
                main('s');
            }
        }
    }

    manualPlaceKey() {
        if(!blockControl) {
            if(manualPlace) {
                mainTetris.endFigureEvent('s', true);
            }
        }
    }

    //------------------------------------------------------------------------------------------------------------------
    //Draw
    drawScore() {
        mainField.drawText('score: ' + score, 25, 350, 50);
    }

    drawSpeed() {
        mainField.drawText('speed: ' + speedLabel, 25, 350, 300);
    }

    drawPause() {
        if(pause) {
            mainField.drawText('pause', 25, 350, 330);
        }
    }

    drawGoal() {
        mainField.drawText('goal', 25, 350, 90);
        mainField.drawText(goalStep + '/' + goalTarget, 25, 350, 120);
    }

    drawHiScore() {
        mainField.drawText('hi-score', 25, 350, 420);
        mainField.drawText(hiScore, 25, 350, 450);
    }

    drawSoundOff() {
        if(enableSound === false) {
            mainField.drawText('sound off', 25, 350, 600);
        }
    }
    //------------------------------------------------------------------------------------------------------------------

    endGame() {
        clearInterval(refreshIntervalId);
        blockControl = true;
        SoundPlay.playSound9();
    }
} //End Tetris class

function drawElements() {
    clueField.drawGrid(gridColor);
    clueField.drawFrame(frameColor, 0.5);

    mainField.drawGrid(gridColor);
    mainField.drawFrame(frameColor);

    mainTetris.drawScore();
    mainTetris.drawGoal();
    mainTetris.drawSpeed();
    mainTetris.drawPause()

    mainTetris.drawSoundOff();

    //mainTetris.drawHiScore();
}

function newGameTetris() {
    pause = false;
    clearInterval(refreshIntervalId);
    if(stepMode === false) {
        refreshIntervalId = setInterval(main, gameSpeed);
    }

    enableSound = true;
    blockControl = false;

    gameField = new Field(
        10,
        10,
        200,
        400,
        10,
        20
    );

    SoundPlay = new Sound();

    mainField = new Field(
        ScreenContext,
        20,
        20,
        gameFieldWidth,
        gameFieldHeight,
        widthCellQuantity,
        heightCellQuantity
    );

    const clueSize = 4;
    clueField = new Field(
        ScreenContext,
        350,
        140,
        gameFieldWidth / widthCellQuantity * clueSize,
        gameFieldHeight / heightCellQuantity * clueSize,
        clueSize,
        clueSize
    );

    mainTetris = new Tetris();
    drawElements();
    score = 0;
    goalStep = 0;
    speedLabel = 1;
    gameSpeed = 1000;
}


function scaleFix() {
    const zeroWidth = 432;
    const zeroScale = 0.79;
    const scaleStep = 0.0018;
    let widthScreen = window.innerWidth;
    let factor = zeroScale - (zeroWidth - widthScreen) * scaleStep;
    document.getElementById('container').style.zoom = factor;
}

function main(mode, key = false) {
    scaleFix();

    if(key === false) {
        mainTetris.activeFigure.y++;
    }

    let collision = mainTetris.checkCollision(
        mainTetris.activeFigure.buffer,
        mainTetris.activeFigure.x,
        mainTetris.activeFigure.y,
        mainTetris.screenMatrix
    );

    if(collision === 'bottom') {
        mainTetris.endFigureEvent(mode);
    }

    if(collision === 'wallL') {
        mainTetris.activeFigure.x++;
    }

    if(collision === 'wallR') {
        mainTetris.activeFigure.x--;
    }

    if(collision === 'field') {

        if(mode === 'a') {
            mainTetris.activeFigure.x++;
        } else

        if(mode === 'd') {
            mainTetris.activeFigure.x--;
        } else

        mainTetris.endFigureEvent(mode);

    }

    mainField.clearScreen();
    clueField.drawFigure(1,1, mainTetris.nextFigure, false); //Draw next figure
    mainField.drawFigure(1,1, mainTetris.screenMatrix, false); //Draw field

    let collisionDraw = mainTetris.checkCollision(
        mainTetris.activeFigure.buffer,
        mainTetris.activeFigure.x,
        mainTetris.activeFigure.y,
        mainTetris.screenMatrix
    );

    if(collisionDraw === 'field') {
        mainTetris.endGame();
    } else {
        mainField.drawFigure( //Draw active figure
            mainTetris.releasePoint.x + mainTetris.activeFigure.x,
            mainTetris.releasePoint.y + mainTetris.activeFigure.y,
            mainTetris.activeFigure.buffer,
            bgFigure,
            mainTetris.activeFigure.color
        );
    }

    drawElements();
}

function handle(e) {
    if (e.keyCode === 65 || e.keyCode === 37) { mainTetris.leftKey(); }   //A
    if (e.keyCode === 68 || e.keyCode === 39) { mainTetris.rightKey(); }  //D
    if (e.keyCode === 87 || e.keyCode === 38) { mainTetris.rotateKey(); } //W
    if (e.keyCode === 83 || e.keyCode === 40) { mainTetris.downKey(); }   //S
    if (e.keyCode === 77) { mainTetris.muteSoundKey(); }                  //M
    if (e.keyCode === 80) { mainTetris.pauseKey(); }                      //P
    if (e.keyCode === 78) { mainTetris.newGameKey(); }                    //N
    if (e.keyCode === 13) { mainTetris.stepModeKey(); }                   //Enter
    if (e.keyCode === 69) { mainTetris.manualPlaceKey(); }                //E
    //console.log(e.keyCode);
}

class Sound {
    constructor() {
        this.sound0 = new Audio('Sounds/mr_9999_00.wav');  //Music           no
        this.sound1 = new Audio('Sounds/mr_9999_01.wav');  //Switch          ok
        this.sound2 = new Audio('Sounds/mr_9999_02.wav');  //Switch x2       ok
        this.sound3 = new Audio('Sounds/mr_9999_03.wav');  //Switch x2 slow  no
        this.sound4 = new Audio('Sounds/mr_9999_04.wav');  //Goal ok         ok
        this.sound5 = new Audio('Sounds/mr_9999_05.wav');  //Figure flip     ok
        this.sound6 = new Audio('Sounds/mr_9999_06.wav');  //Error           no
        this.sound7 = new Audio('Sounds/mr_9999_07.wav');  //Error+          no
        this.sound8 = new Audio('Sounds/mr_9999_08.wav');  //Error x3        no
        this.sound9 = new Audio('Sounds/mr_9999_09.wav');  //Losing          ok
        this.sound10 = new Audio('Sounds/mr_9999_10.wav'); //Korobeiniki     no
        this.sound11 = new Audio('Sounds/mr_9999_11.wav'); //Error 2         no
        this.sound12 = new Audio('Sounds/mr_9999_12.wav'); //Error 3         no
        this.sound13 = new Audio('Sounds/mr_9999_13.wav'); //Adding figure   ok
        this.sound14 = new Audio('Sounds/mr_9999_14.wav'); //Keys            ok
        this.sound15 = new Audio('Sounds/mr_9999_15.wav'); //Deleting row    ок
    }

    playSound0() {
        if(enableSound === true) {
            this.sound0.currentTime = 0.0;
            this.sound0.volume = soundVolume;
            this.sound0.play();
        }
    }

    playSound1() {
        if(enableSound === true) {
            this.sound1.currentTime = 0.0;
            this.sound1.volume = soundVolume;
            this.sound1.play();
        }
    }

    playSound2() {
        if(enableSound === true) {
            this.sound2.currentTime = 0.0;
            this.sound2.volume = soundVolume;
            this.sound2.play();
        }
    }

    playSound3() {
        if(enableSound === true) {
            this.sound3.currentTime = 0.0;
            this.sound3.volume = soundVolume;
            this.sound3.play();
        }
    }

    playSound4() {
        if(enableSound === true) {
            this.sound4.currentTime = 0.0;
            this.sound4.volume = soundVolume;
            this.sound4.play();
        }
    }

    playSound5() {
        if(enableSound === true) {
            this.sound5.currentTime = 0.0;
            this.sound5.volume = soundVolume;
            this.sound5.play();
        }
    }

    playSound6() {
        if(enableSound === true) {
            this.sound6.currentTime = 0.0;
            this.sound6.volume = soundVolume;
            this.sound6.play();
        }
    }

    playSound7() {
        if(enableSound === true) {
            this.sound7.currentTime = 0.0;
            this.sound7.volume = soundVolume;
            this.sound7.play();
        }
    }

    playSound8() {
        if(enableSound === true) {
            this.sound8.currentTime = 0.0;
            this.sound8.volume = soundVolume;
            this.sound8.play();
        }
    }

    playSound9() {
        if(enableSound === true) {
            this.sound9.currentTime = 0.0;
            this.sound9.volume = soundVolume;
            this.sound9.play();
        }
    }

    playSound10() {
        if(enableSound === true) {
            this.sound10.currentTime = 0.0;
            this.sound10.volume = soundVolume;
            this.sound10.play();
        }
    }

    playSound11() {
        if(enableSound === true) {
            this.sound11.currentTime = 0.0;
            this.sound11.volume = soundVolume;
            this.sound11.play();
        }
    }

    playSound12() {
        if(enableSound === true) {
            this.sound12.currentTime = 0.0;
            this.sound12.volume = soundVolume;
            this.sound12.play();
        }
    }

    playSound13() {
        if(enableSound === true) {
            this.sound13.currentTime = 0.0;
            this.sound13.volume = soundVolume;
            this.sound13.play();
        }
    }

    playSound14() {
        if(enableSound === true) {
            this.sound14.currentTime = 0.0;
            this.sound14.volume = soundVolume;
            this.sound14.play();
        }
    }

    playSound15() {
        if(enableSound === true) {
            this.sound15.currentTime = 0.0;
            this.sound15.volume = soundVolume;
            this.sound15.play();
        }
    }

}

/* Get the documentElement (<html>) to display the page in fullscreen */
const elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

const leftKeyId = document.getElementById('leftKeyEvent');
const rightKeyId = document.getElementById('rightKeyEvent');
const quickKeyId = document.getElementById('quickKeyEvent');
const downKeyId = document.getElementById('downKeyEvent');
const rotateKeyId = document.getElementById('rotateKeyEvent');
const resetKeyId = document.getElementById('resetKeyEvent');
const muteSoundId = document.getElementById('muteSoundKeyEvent');
const pauseKeyId = document.getElementById('pauseKeyEvent');
const optionsKeyId = document.getElementById('optionsKeyEvent');
const scrRes = document.getElementById('scrRes');


let leftKeyEventInterval;
function leftKeyEventDown() {
    mainTetris.leftKey();
    leftKeyEventInterval = setInterval (() => mainTetris.leftKey(true), 100);
}
function leftKeyEventUp() {
    clearInterval(leftKeyEventInterval);
}

let rightKeyEventInterval;
function rightKeyEventDown() {
    mainTetris.rightKey();
    rightKeyEventInterval = setInterval (() => mainTetris.rightKey(true), 100);
}
function rightKeyEventUp() {
    clearInterval(rightKeyEventInterval);
}

function quickKeyEventDown() {
    mainTetris.quickKey();
}

let downKeyEventInterval;
function downKeyEventDown() {
    mainTetris.downKey();
    downKeyEventInterval = setInterval (() => mainTetris.downKey(true), 50);
}
function downKeyEventUp() {
    clearInterval(downKeyEventInterval);
}

function rotateKeyEventDown() {
    mainTetris.rotateKey();
}
function rotateKeyEventUp() {
    //mainTetris.rotateKey();
}

function resetKeyEventDown() {
    mainTetris.newGameKey();
}

function muteSoundKeyEventDown() {
    mainTetris.muteSoundKey();
}

function pauseKeyEventDown() {
    mainTetris.pauseKey();
}

function optionsKeyEventDown() {
    //optionsKey
}

document.body.oncontextmenu = function (e) { return false; };

leftKeyId.addEventListener("touchstart", leftKeyEventDown);
rightKeyId.addEventListener("touchstart", rightKeyEventDown);
quickKeyId.addEventListener("touchstart", quickKeyEventDown);
downKeyId.addEventListener("touchstart", downKeyEventDown);
rotateKeyId.addEventListener("touchstart", rotateKeyEventDown);
resetKeyId.addEventListener("touchstart", resetKeyEventDown);
muteSoundId.addEventListener("touchstart", muteSoundKeyEventDown);
pauseKeyId.addEventListener("touchstart", pauseKeyEventDown);
optionsKeyId.addEventListener("touchstart", optionsKeyEventDown);

leftKeyId.addEventListener("touchend", leftKeyEventUp);
rightKeyId.addEventListener("touchend", rightKeyEventUp);
//quickKeyId.addEventListener("mouseup", quickKeyEventUp);
downKeyId.addEventListener("touchend", downKeyEventUp);
rotateKeyId.addEventListener("touchend", rotateKeyEventUp);
//resetKeyId.addEventListener("mouseup", resetKeyEventUp);
//muteSoundId.addEventListener("mouseup", muteSoundKeyEventUp);
//pauseKeyId.addEventListener("mouseup", pauseKeyEventUp);
//optionsKeyId.addEventListener("mouseup", optionsKeyEventUp);

scrRes.addEventListener("touchstart", () => {
    document.getElementById('scrRes').innerHTML = window.innerWidth + ' x ' + window.innerHeight;
});