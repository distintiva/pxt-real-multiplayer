/** ********************************************************
 * By Distintiva Solutions (www.distintivasolutions.com)
 * Jose Carlos (info@distintivasolutions.com)
 * 
 * 
 * https://github.com/distintiva/pxt-real-multiplayer
 * 
 * 
 * 
 * Based on the code provided by Richard Knoll
 * https://forum.makecode.com/t/hardware-multiplayer-game/132
 * 
 ***********************************************************/

//% weight=0 color=#DDB012 icon="\uf0e8" block="Real Multiplayer"
//% advanced=false
namespace multiplayer {
    export enum GameMessage {
        Update = 7,
        HudUpdate = 11,
        CreateSprite = 20,
        DestroySprite = 21,
        SyncSprite = 22
    }

    export enum Players12 {
        None = 0,
        Player1 = 1,
        Player2 = 2
    }

    enum ProgramState {
        Waiting = 0,
        Counting = 1,
        Playing = 2,
        Disconnected = 3
    }


    const socket = multiplayer.Socket.getInstance();

    let funcOnConnected: () => void;
    let funcOnMasterLoop: () => void;

    //- Wait screen
    let waitTitle = "", waitSubtitle = "", waitTitleColor = 1;
    let waitMessageText = "", waitMessageColor = 8, waitProgressBarColor = 8;

    //- Player 1 and Player 2 srpites
    let pl1: Sprite = null, pl2: Sprite = null;

    let programState = ProgramState.Waiting;

    let useHWMultiplayer = false;
    const dbFont = image.doubledFont(image.font8);



    //% blockId=sharedImgsb
    //% block="shared images %img"
    //% img.shadow="lists_create_with"
    export function sharedImgs(img: Image[]): void {

        img.forEach(function (value: Image, index: number) {
            syncedImages[getImageId(value)] = value;
        });

    }

    //% blockId=multiPlayerStart
    //% block="wait for mutiplayer connection %activate=toggleOnOff"
    export function waitForConnection(activate: boolean): void {

        useHWMultiplayer = activate;

        if (useHWMultiplayer) {  //-
            startMultiplayer();
        } else {
            startSimulated();

            controller.player2.onButtonEvent(ControllerButton.A, ControllerButtonEvent.Pressed, function () {

                controller.A.setPressed(true);
                controller.A.setPressed(false);

            })

            controller.player2.onButtonEvent(ControllerButton.B, ControllerButtonEvent.Pressed, function () {

                controller.B.setPressed(true);
                controller.B.setPressed(false);

            })

        }

    }

    //% blockId=CurrentPlayer
    //% block="current player"
    export function CurrentPlayer(): Sprite {

        if (isPlayerOne()) {
            return pl1;
        }
        return pl2;

    }

    //% blockId=isPlayer1
    //% block="is player 1"
    export function isPlayer1(): boolean {
        if (!useHWMultiplayer) {
            if (controller.player2.A.isPressed() || controller.player2.B.isPressed()) {
                return false;
            }
        }

        return isPlayerOne();
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
    export function drawTitle(text: string, sub: string = null, color: number = 1): void {
        waitTitle = text;

        if (sub == null) sub = "";
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

        if (isPlayerOne()) {
            controller.moveSprite(pl1, vx, vy);
        } else {
            controller.moveSprite(pl2, vx, vy);
        }

        //- on simulator mode
        if (!useHWMultiplayer) {
            controller.player2.moveSprite(pl2, vx, vy);
        }
    }

    //% blockId="spriteOwnsTo" block="sprite %proy=variables_get(sprite1) belongs to $player "
    export function spriteOwnsTo(proy: Sprite, player: Players12): void {
        proy.data = player;

    }

    //% blockId="isSpriteFrom" block="is sprite %proy=variables_get(sprite1) from $player "
    export function spriteIsFrom(proy: Sprite, player: Players12): boolean {

        //-main process is allways controlled  by player 1
        if (useHWMultiplayer && !isPlayerOne()) return false;

        if (proy.data != undefined) {
            return proy.data === player;
        }
        return false;
    }


    //%  block="sync sprite %proy=variables_get(sprite1) "
    export function syncThisSprite(sp: Sprite): void {

        syncSprite(sp);


    }



    //===================================================================================

    let offset = 0;
    let flip = true;
    let readyCount = 3000;
    let sceneDisconnected = false; //- if there is any scene to print disconnection

    function startMultiplayer() {
        game.onShade(function () {
            waitForOtherPlayer();

            if (useHWMultiplayer && programState === ProgramState.Disconnected) {
                if (!sceneDisconnected) {
                    game.pushScene();
                    sceneDisconnected = true;
                    //scene.setBackgroundColor(6);

                    const imDisc: Image = image.create(screen.width, screen.height);
                    imDisc.fill(0);
                    imDisc.printCenter("CONNECTION", 30, 1, dbFont);
                    imDisc.printCenter("LOST", 46, 1, dbFont);
                    scene.setBackgroundImage(imDisc);
                }


            }


        });

        socket.onConnect(function () {
            if (programState === ProgramState.Waiting) {
                programState = ProgramState.Counting;
                readyCount = 4000;
            }
            else if (programState === ProgramState.Disconnected) {
                programState = ProgramState.Playing;

                if (sceneDisconnected) {
                    sceneDisconnected = false;
                    game.popScene();
                }

            }
        });

        socket.onDisconnect(function () {

            if (programState === ProgramState.Playing) {

                programState = ProgramState.Disconnected;

                if (sceneDisconnected) {
                    // game.popScene();
                }
                /* sceneDisconnected = true;
                 game.pushScene();
            
                 game.onShade(function () {
                     if (!useHWMultiplayer) return ;
                     //console.log("onDisconn Shade ");
                     screen.printCenter("CONNECTION", 30, 1, dbFont);
                     screen.printCenter("LOST", 46, 1, dbFont);
                 });
                 programState = ProgramState.Disconnected;
                 */

            }
        });

        socket.onMessage((packet: SocketPacket) => {
            socketOnMessage(packet);
        })

    }

    function startSimulated() {
        if (funcOnConnected) funcOnConnected();
        programState = ProgramState.Playing;
    }


    /*game.onUpdateInterval(100, () => {
        if (programState == ProgramState.Playing && useHWMultiplayer) {
            sendPlayerState();

            
                while (newCreated.length){

                    const sprite: Sprite = newCreated[newCreated.length - 1];

                    console.log("created id:" + sprite.id);
                    syncSprite(sprite);    
               
                    newCreated.pop();
                }
        }

    });*/

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

    sprites.onDestroyed(SpriteKind.Enemy, function (sprite) {
        sendDestroy(sprite);
    })

    function sendDestroy(sprite: Sprite) {

        const packet = new SocketPacket();
        packet.arg1 = GameMessage.DestroySprite;
        packet.arg2 = sprite.kind();
        packet.arg3 = sprite.id;

        socket.sendCustomMessage(packet);
    }

    function destroySprite(packet: SocketPacket) {

        const sp = sprites.allOfKind(packet.arg2).find(s => s.id == packet.arg3);

        if (sp != undefined && sp) sp.destroy();

    }


    function syncSprite(sprite: Sprite) {

        const packet = new SocketPacket();
        packet.arg1 = GameMessage.CreateSprite;
        packet.arg2 = sprite.kind();
        packet.arg3 = sprite.x;
        packet.arg4 = sprite.y;
        packet.arg5 = sprite.vx;
        packet.arg6 = sprite.vy;
        packet.arg7 = sprite.data;


//        packet.arg9_32 = getImageId(sprite.image);
        packet.arg10_32 = sprite.id;

        let packet2 = new SocketPacket();
        packet2.arg1 = GameMessage.SyncSprite;
        packet2.add16(sprite.kind());
        packet2.add16(sprite.id);
        packet2.add8(sprite.x);
        packet2.add8(sprite.y);
        packet2.add8(sprite.vx);
        packet2.add8(sprite.vy);
        packet2.add8(sprite.data);
        packet2.add32(getImageId(sprite.image)  );

        console.log("IMAGE send:" + getImageId(sprite.image));
        


        socket.sendCustomMessage(packet2);

    }

    function getSyncSprite(packet: SocketPacket) {
        let kind = packet.get16();
        let id = packet.get16();
        let x = packet.get8();
        let y = packet.get8();
        let vx = packet.get8();
        let vy = packet.get8();
        let data = packet.get8();
        let imId = packet.get32();

        console.log("IMAGE Get:" + imId );


        let sp: Sprite = sprites.allOfKind(kind).find(s => s.id == id);

        if (sp == undefined) {
            sp = sprites.create(syncedImages[ imId ]);
        }

        if (sp != undefined){
            sp.setKind(kind)
            sp.setPosition(x, y);
            sp.setVelocity(vx, vy);
            sp.data = data;
            sp.setImage( syncedImages[imId] );
            sp.id = id;

            sp.setFlag(SpriteFlag.AutoDestroy, true);

        }             



    }

    function createSprite(packet: SocketPacket) {

        //- exists sprite with this id ?

        if (sprites.allOfKind(packet.arg2).find(s => s.id == packet.arg10_32)) {
            //console.log("EXISTS " + packet.arg10_32);
            return;
        }


        let spriteImageId = packet.arg9_32;
        const sprite = sprites.create(syncedImages[spriteImageId]);

        sprite.setFlag(SpriteFlag.AutoDestroy, true);

        sprite.setKind(packet.arg2);
        sprite.x = packet.arg3;
        sprite.y = packet.arg4;
        sprite.vx = packet.arg5;
        sprite.vy = packet.arg6;
        sprite.data = packet.arg7;

        sprite.id = packet.arg10_32;

        sprite.setFlag(SpriteFlag.AutoDestroy, true);

    }

    let lastPlayerPacket: string = "";
    function sendPlayerState(kind = GameMessage.Update, arg = 0) {
        const playerSprite = isPlayerOne() ? pl1 : pl2;

        const packet = new SocketPacket();
        packet.arg1 = kind;
        packet.arg2 = playerSprite.x;
        packet.arg3 = playerSprite.y;
        packet.arg4 = playerSprite.vx;
        packet.arg5 = playerSprite.vy;

        if (packet.toString == lastPlayerPacket) {
            return;
        }

        lastPlayerPacket = packet.toString;

        socket.sendCustomMessage(packet);

        if (isPlayerOne()) {
            sendHUD();
        }
    }

    let lastHUDPacket: string = "";
    function sendHUD() {

        const packet = new SocketPacket(control.createBuffer(17));
        packet.arg1 = GameMessage.HudUpdate;
        packet.arg2 = info.score();
        packet.arg3 = info.life();
        packet.arg4 = info.player2.score();
        packet.arg5 = info.player2.life();

        if (packet.toString == lastHUDPacket) return;
        lastHUDPacket = packet.toString;

        socket.sendCustomMessage(packet);

    }

    function updateHUD(packet: SocketPacket) {

        info.setScore(packet.arg2);
        if (packet.arg3) info.setLife(packet.arg3);
        info.player2.setScore(packet.arg4);

        if (packet.arg3) info.player2.setLife(packet.arg5);


    }


    function updatePlayerState(packet: SocketPacket) {

        const otherSprite = isPlayerOne() ? pl2 : pl1;
        otherSprite.x = packet.arg2;
        otherSprite.y = packet.arg3;
        otherSprite.vx = packet.arg4;
        otherSprite.vy = packet.arg5;
    }





    function socketOnMessage(packet: SocketPacket) {
        switch (packet.arg1) {
            case GameMessage.Update:
                updatePlayerState(packet);
                break;
            case GameMessage.CreateSprite:
                createSprite(packet);
                break;
            case GameMessage.HudUpdate:
                updateHUD(packet);
                break;
            case GameMessage.DestroySprite:
                destroySprite(packet);
                break;
            case GameMessage.SyncSprite:
                getSyncSprite(packet);
                break;

        }
    }



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

                if (funcOnConnected) funcOnConnected();
                programState = ProgramState.Playing;
                return;

            }

            if (isPlayerOne()) {
                screen.printCenter("PLAYER 1", 26, 1, dbFont);
            } else {
                screen.printCenter("PLAYER 2", 26, 1, dbFont);
            }

            screen.printCenter("" + Math.idiv(readyCount, 1000), 80, 1, dbFont);
        }
    }



    function isPlayerOne() {
        if (!useHWMultiplayer) return true;
        return socket.session.playerNumber === 1;
    }
}

