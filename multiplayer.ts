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
        SyncSprite = 14,
        DestroySprite = 18        
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

    //% blockId=inMaster
    //% block="executed in master"
    export function inMaster(): boolean {

        return isPlayerOne();
    }

    //% blockId=gameStarted
    //% block="playing game"
    export function gameStarted(): boolean {
       return programState == ProgramState.Playing
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


   game.onUpdateInterval(100, () => {
        if (programState == ProgramState.Playing && useHWMultiplayer) {
            sendPlayerState();

            
               /* while (newCreated.length){

                    const sprite: Sprite = newCreated[newCreated.length - 1];

                    console.log("created id:" + sprite.id);
                    syncSprite(sprite);    
               
                    newCreated.pop();
                }*/
        }

    });

    let newCreated: Sprite[] = [];

    

    controller.anyButton.onEvent(ControllerButtonEvent.Pressed, function () {
        if(useHWMultiplayer && programState == ProgramState.Playing){
            sendPlayerState();
        }
    })
    controller.anyButton.onEvent(ControllerButtonEvent.Released, function () {
        if (useHWMultiplayer && programState == ProgramState.Playing) {
            sendPlayerState();
        }
    })

    
    function sendDestroy(sprite: Sprite) {

        const packet = new SocketPacket();
        packet.arg1 = GameMessage.DestroySprite;
        packet.add16( sprite.kind() );
        packet.add16( sprite.id );
        
        socket.sendCustomMessage(packet);
    }

    function destroySprite(packet: SocketPacket) {
        const kind = packet.get16();
        const id = packet.get16();

        const sp = sprites.allOfKind( kind ).find(s => s.id == id);

        if (sp != undefined && sp){
            console.log(" DESTROY ====== " + id);
             sp.destroy();
        }

    }


    function syncSprite(sprite: Sprite, pkHex: string = null): string {

        if (sprite.data!=1 &&  sprite.data != 2){
             sprite.data = isPlayer1()?1:2;
             sprite.id = sprite.id+sprite.data * 1000;
        }
      
        const packet2 = new SocketPacket();
        packet2.arg1 = GameMessage.SyncSprite;
        packet2.add16(sprite.kind());
        packet2.add16(sprite.id);
        packet2.add16(sprite.x);
        packet2.add16(sprite.y);
        packet2.add16(sprite.vx);
        packet2.add16(sprite.vy);
        packet2.add8(sprite.data);
        packet2.add32(getImageId(sprite.image)  );

        const pkStr = packet2.toString;
        if (pkHex==null  || (pkHex != null && pkHex != pkStr))  {        
            socket.sendCustomMessage(packet2);
            console.log("> SEND: ---------" + sprite.id);
        }

        return pkStr;

    }

    function getSyncSprite(packet: SocketPacket) {
        let kind = packet.get16();
        let id = packet.get16();
        let x = packet.get16();
        let y = packet.get16();
        let vx = packet.get16();
        let vy = packet.get16();
        let data = packet.get8();
        let imId = packet.get32();

       // console.log("IMAGE Get:" + imId );


        let sp: Sprite = sprites.allOfKind(kind).find(s => s.id == id);

        if (sp == undefined) {
            sp = sprites.create(syncedImages[ imId ]);
            console.log("> RECV create   :" + id);
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

   

    let lastPlayerPacket: string = "";
    function sendPlayerState(kind = GameMessage.Update, arg = 0) {
        const playerSprite = isPlayerOne() ? pl1 : pl2;

        const packet2 = new SocketPacket();
        packet2.arg1 = GameMessage.Update;
        packet2.add16(playerSprite.x);
        packet2.add16(playerSprite.y);
        packet2.add16(playerSprite.vx);
        packet2.add16(playerSprite.vy);
        packet2.add32(getImageId(playerSprite.image));

        const packetStr:string = packet2.toString;
        if (packetStr == lastPlayerPacket) {
            return;
        }
        lastPlayerPacket = packetStr;

        socket.sendCustomMessage(packet2);

        if (isPlayerOne()) {
     //       sendHUD();
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

        otherSprite.x = packet.get16();
        otherSprite.y = packet.get16();
        otherSprite.vx = packet.get16();
        otherSprite.vy = packet.get16();

        otherSprite.setImage(syncedImages[packet.get32()]  );

    }





    function socketOnMessage(packet: SocketPacket) {
        switch (packet.arg1) {
            case GameMessage.Update:
                updatePlayerState(packet);
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

                //- start game multiplayer ------

                //- handle and sync every sprite destroyed
                for (let c = 1000; c < 1100; c++) {
                    sprites.onDestroyed(c, function (sprite: Sprite) {
                      if(isPlayerOne)  sendDestroy(sprite);
                    })
                }
                               
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

