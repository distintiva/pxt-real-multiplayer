//% weight=0 color=#DDB012 icon="\uf0e8" block="Real Multiplayer"
//% advanced=false
namespace multiplayer {
    enum GameMessage {
        Update = 7,
        LaserCreated = 8,
        AsteroidCreated = 9,
        AsteroidDestroyed = 10,
        HudUpdate = 11,
        CreateSprite = 20
    }


    function imageCRC(im: Image): number {
        let imcrc = 0;
        for (let f = 0; f < im.height; f++) {
            for (let c = 0; c < im.width; c++) {
                let px = im.getPixel(f, c);
                imcrc += px * c + (c * f);
            }
        }
        return imcrc
    }

    function test() {

    }

    //let socket:Socket;
    const socket = multiplayer.Socket.getInstance();

    enum ProgramState {
        Waiting = 0,
        Counting = 1,
        Playing = 2,
        Disconnected = 3
    }

    let funcOnConnected: () => void;
    let funcOnMasterLoop: () => void;

    let waitTitle = "", waitSubtitle = "", waitTitleColor = 1;
    let waitMessageText = "", waitMessageColor = 8, waitProgressBarColor = 8;


    let pl1: Sprite, pl2: Sprite;
    let _vx: number = 100, _vy: number = 100;

    let programState = ProgramState.Waiting;

    let gameStarted = false;

    let useHWMultiplayer = false;

    const dbFont = image.doubledFont(image.font8);

    let offset = 0;
    let flip = true;
    let readyCount = 3000;

    export interface IHash {
        [details: number]: Image;
    }
    let images: IHash = {};

    //% blockId=myFunction
    //% block="shared image %img=screen_image_picker"
    export function myFunction(img: Image): void {

        images[imageCRC(img)] = img;

        console.log("IMAGE SHARED:");
        console.log(imageCRC(img));
    }



    //% blockId=sharedImgsb
    //% block="shared images %img"
    //% img.shadow="lists_create_with"
    export function sharedImgs(img: Image[]): void {

        img.forEach(function (value: Image, index: number) {
            images[imageCRC(value)] = value;
            console.log("IMAGEN " + index)
        });

    }


    //% blockId=multiPlayerStart
    //% block="wait for mutiplayer connection %activate=toggleOnOff"
    export function multiPlayerStart(activate: boolean): void {

        if (!activate) return;

        
        jacdac.controllerService.stop();
        useHWMultiplayer = true;

       

    }

    //% blockId=CurrentPlayer
    //% block="current player"
    export function CurrentPlayer(): Sprite {

        if (isPlayerOne()) {
            return pl1;
        }
        return pl2;

    }

    //% blockId=SrpiteChanged
    //% block="sprite changed %sprite"
    //% sprite.shadow="variables_get" angleChange.defl=0
    export function spriteChanged(sprite: Sprite): void {

        if (programState != ProgramState.Playing) return;


        if (useHWMultiplayer) {

            const packet = new SocketPacket();
            packet.arg1 = GameMessage.CreateSprite;
            packet.arg2 = 0;
            packet.arg3 = sprite.x;
            packet.arg4 = sprite.y;
            packet.arg5 = sprite.vx;
            packet.arg6 = sprite.vy;
            packet.arg7 = imageCRC(sprite.image);


            socket.sendCustomMessage(packet);

            console.log("Send Create");
            console.log(sprite.x);
            console.log(sprite.y);
            console.log(sprite.vx);
            console.log(sprite.vy);
        }

    }





    //% blockId=onConnected block="on multiplayer connected"
    //% blockAllowMultiple=0
    export function onConnected(a: () => void): void {
        if (!a) return;
        funcOnConnected = a;
        return;
    }

    //% blockId=onMasterLoop block="on master loop every $every"
    //% every.shadow="timePicker"
    export function onMasterLoop(every: number, a: () => void): void {
        if (!a) return;



        if (isPlayerOne()) {
            game.onUpdateInterval(every, function () {
                if (programState == ProgramState.Playing && isPlayerOne()) a();
            }
            );
        }


    }

    // group="Gameplay"
    //% blockId=drawTitle block="wait title $text || subtitle $sub | color %color=colorindexpicker"
    //% blockAllowMultiple=0
    //% color.defl=1
    //% color.min=1 color.max=15
    //% text.defl=""
    //% sub.defl=""
    //% expandableArgumentMode="toggle"
    export function drawTitle(text: string, sub: string, color: number): void {
        waitTitle = text;
        waitSubtitle = sub;
        waitTitleColor = color;
    }

    //% blockId=waitMessage block="wait message $text || color %color=colorindexpicker | progress color %barcolor=colorindexpicker"
    //% blockAllowMultiple=0
    //% color.defl=8
    //% barcolor.defl=8
    //% text.defl="Waiting for connection"
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    export function waitMessage(text: string, color: number = 8, barcolor: number = 8): void {
        waitMessageText = text;
        waitMessageColor = color;
        waitProgressBarColor = barcolor;
    }

    // group="Gameplay"

    //% blockId="moveplayers" block="move $player1=variables_get(player1) $player2=variables_get(player2) ||vx $vx vy $vy"
    //% vx.defl=100 vy.defl=100
    //% blockAllowMultiple=0
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    export function movePlayers(player1: Sprite, player2: Sprite, vx: number = 100, vy: number = 100): void {
        pl1 = player1;
        pl2 = player2;
        _vx = vx;
        _vy = vy;

        if (isPlayerOne()) {
            controller.moveSprite(pl1, _vx, _vy);
        } else {
            controller.moveSprite(pl2, _vx, _vy);
        }

        //- on simulator mode
        if (!useHWMultiplayer) {
            controller.player2.moveSprite(pl2, _vx, _vy);
        }
        test();

    }

    //==================================





    game.onShade(function () {
        if (useHWMultiplayer) {
            waitForOtherPlayer();
        } else {

            if (!gameStarted) {
                if (funcOnConnected) funcOnConnected();
                gameStarted = true;
                programState = ProgramState.Playing;
            }
        }
    })

    game.onUpdateInterval(100, () => {
        if (programState == ProgramState.Playing && useHWMultiplayer) {
            sendPlayerState();

            if (newCreated.length) {
                console.log("Sprites created " + newCreated.length)

                const sprite: Sprite = newCreated[newCreated.length - 1];

                const packet = new SocketPacket();
                packet.arg1 = GameMessage.CreateSprite;
                packet.arg2 = 0;
                packet.arg3 = sprite.x;
                packet.arg4 = sprite.y;
                packet.arg5 = sprite.vx;
                packet.arg6 = sprite.vy;
                packet.arg7 = imageCRC(sprite.image);


                socket.sendCustomMessage(packet);

                newCreated.pop();


            }
        }

    });

    let newCreated: Sprite[] = [];

    sprites.onCreated(SpriteKind.Enemy, function (sprite) {

        newCreated.push(sprite);

    })

    sprites.onCreated(SpriteKind.Projectile, function (sprite) {

        newCreated.push(sprite);

    })

    sprites.onCreated(SpriteKind.Food, function (sprite) {

        newCreated.push(sprite);

    })





    function createSprite(x: number, y: number, vx: number, vy: number, imgcrc: number) {

        //const sprite = this.st.createSprite(sprites.space.spaceAsteroid2, SpriteKindLegacy.Asteroid, id);
        const sprite = sprites.create(images[imgcrc], SpriteKind.Enemy);

        sprite.setFlag(SpriteFlag.AutoDestroy, true);

        //sprite.setKind(SpriteKind.Enemy);
        sprite.x = x;
        sprite.y = y;
        sprite.vx = vx;
        sprite.vy = vy;

        sprite.setFlag(SpriteFlag.AutoDestroy, true);

        // spriteT = sprite;


    }

    function sendPlayerState(kind = GameMessage.Update, arg = 0) {
        const playerSprite = isPlayerOne() ? pl1 : pl2;
        const packet = new SocketPacket();
        packet.arg1 = kind;
        packet.arg2 = playerSprite.x;
        packet.arg3 = playerSprite.y;
        packet.arg4 = playerSprite.vx;
        packet.arg5 = playerSprite.vy;

        socket.sendCustomMessage(packet);

        /*if (isPlayerOne()) {
            this.sendHUD();
        }*/
    }

    function updatePlayerState(packet: SocketPacket) {
        const otherSprite = isPlayerOne() ? pl2 : pl1;
        otherSprite.x = packet.arg2;
        otherSprite.y = packet.arg3;
        otherSprite.vx = packet.arg4;
        otherSprite.vy = packet.arg5;
    }

    socket.onMessage((packet: SocketPacket) => {
        switch (packet.arg1) {
            case GameMessage.Update:
                updatePlayerState(packet);
                break;
            case GameMessage.CreateSprite:
                createSprite(packet.arg3, packet.arg4, packet.arg5, packet.arg6, packet.arg7);
                console.log("CREATE: ");
                console.log(packet.arg7);
                break
            /*case GameMessage.LaserCreated:
                this.updatePlayerState(packet);
                if (isPlayerOne()) {
                    this.createLaser(SpriteKindLegacy.Laser2, this.ship2, packet.arg5);
                }
                else {
                    this.createLaser(SpriteKindLegacy.Laser1, this.ship1, packet.arg5);
                }
                break;
            case GameMessage.AsteroidCreated:
                this.createAsteroid(packet.arg2, packet.arg3)
                break;
            case GameMessage.AsteroidDestroyed:
                this.handleCollision(packet.arg2, packet.arg3, packet.arg4 === 1)
                break;
            case GameMessage.HudUpdate:
                this.updateHUD(packet);
                break;*/
        }
    })







    function waitForOtherPlayer() {
        if (programState === ProgramState.Waiting) {

            screen.printCenter(waitTitle, 10, waitTitleColor, image.font12);
            screen.printCenter(waitSubtitle, 26, waitTitleColor, image.font12);

            screen.printCenter(waitMessageText, 80, waitMessageColor, image.font8);

            if (flip) {
                screen.fillRect(30, 95, offset, 3, waitProgressBarColor);
            }
            else {
                screen.fillRect(30 + offset, 95, 100 - offset, 3, waitProgressBarColor);
            }

            offset = (offset + 1) % 100;

            if (!offset) flip = !flip;
        }
        else if (programState === ProgramState.Counting) {
            readyCount -= game.eventContext().deltaTimeMillis;
            if (readyCount <= 0) {

                //const g = new multiplayer.Game(socket);
                //g.startGame();
                //startGame();
                if(funcOnConnected) funcOnConnected();
                programState = ProgramState.Playing;
                return;

            }

            if (isPlayerOne()) {
                screen.printCenter("GET READY 1", 26, 1, dbFont);
                // controller.moveSprite(pl1,_vx, _vy);

            } else {
                screen.printCenter("GET READY 2", 26, 1, dbFont);
                //   controller.moveSprite(pl2, _vx, _vy);

            }

            screen.printCenter("" + Math.idiv(readyCount, 1000), 80, 1, dbFont);
        }
    }

    socket.onConnect(function () {
        if (programState === ProgramState.Waiting) {
            programState = ProgramState.Counting;
            readyCount = 4000;
        }
        else if (programState === ProgramState.Disconnected) {
            game.popScene();
        }
    });

    socket.onDisconnect(function () {
        if (programState === ProgramState.Playing) {
            game.pushScene();
            /*game.onShade(function () {
                if (!useHWMultiplayer) return ;
                screen.printCenter("CONNECTION", 30, 1, dbFont);
                screen.printCenter("LOST", 46, 1, dbFont);
            });*/
            programState = ProgramState.Disconnected;
        }
    });

    enum SpriteKindLegacy {
        Player1,
        Player2,
        Laser1,
        Laser2,
        Asteroid
    }

    function isPlayerOne() {
        if (!useHWMultiplayer) return true;
        return socket.session.playerNumber === 1;
    }
}

