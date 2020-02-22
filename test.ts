namespace SpriteKind {
    export const PJ1 = SpriteKind.create()
    export const PJ2 = SpriteKind.create()
}

 console.log("a");






controller.B.onEvent(ControllerButtonEvent.Pressed, function () {


    
    let sp: Sprite = sprites.allOfKind(SpriteKind.PJ1).find(s => s.id == 0);

    console.log(sp);






    rand = sprites.create(img`
        f f f f f f f f f f f f f f f f
        f f f f f f f f f f f f f f f f
        f f f d d d d f f f f f f f f f
        f c d f d d f d f f f f f f f f
        f c d f d d f d f f d d f f f f
        c d f f d d d d f f b d c f f f
        c d d d d c d d f f b d c f f f
        c c c c c d d d f f f c f f f f
        f f d d d d d f f f f f f f f f
        f f f f f f f f f f f f f f f f
        f f f f f f f f f f f f f f f f
        f f f f f f f f f f f f f f f f
        f f f f f f f f f f f f f f f f
        f f f f d b f d b f f f f f f f
        f f f f d d c d d b b d f f f f
        f f f f f f f f f f f f f f f f
    `, SpriteKind.PJ2)
    rand.setPosition(Math.randomRange(0, 160), Math.randomRange(0, 120))
    rand.setVelocity(20, 0)

    

   
 
   


    /*for (const k in game.currentScene().spritesByKind() ){
        console.log("K:" + k);
    }*/
   
    multiplayer.syncThisSprite(rand) 
    //- le meto un data (si no lo tiene) = al numero del jugador que lo crea y un ID
    //- si no tiene data, le asigno un ID
    //- si es player 2 inicializo el ID de sprites en 1000

   /* for( let k in SpriteKind){
        console.log("Kind " + k);
    }*/
   

})




sprites.onCreated(0, function (sprite: Sprite) {
    console.log("ID2:" + sprite.id);
    sprite.id=10;
    console.log("ID3:" + sprite.id);

    setInterval(function () {
        //- si tiene Data es del otro jugador
        console.log("parametros");
    }, 50)
})
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    console.log(SpriteKind.PJ1)
    mySprite.setPosition(Math.randomRange(0, 160), Math.randomRange(0, 120))
    multiplayer.syncThisSprite(mySprite)
})
multiplayer.onConnected(function () {
    scene.setBackgroundColor(7)
    mySprite = sprites.create(img`
        . . . f 4 4 f f f f . . . . . .
        . . f 4 5 5 4 5 f b f f . . . .
        . . f 5 5 5 5 4 e 3 3 b f . . .
        . . f e 4 4 4 e 3 3 3 3 b f . .
        . . f 3 3 3 3 3 3 3 3 3 3 f . .
        . f 3 3 e e 3 b e 3 3 3 3 f . .
        . f 3 3 e e e f f 3 3 3 3 f . .
        . f 3 e e e f b f b b b b f . .
        . . f e 4 4 f 1 e b b b b f . .
        . . . f 4 4 4 4 f b b b b f f .
        . . . f e e e f f f b b b b f .
        . . . f d d d e 4 4 f b b f . .
        . . . f d d d e 4 4 e f f . . .
        . . f b d b d b e e b f . . . .
        . . f f 1 d 1 d 1 d f f . . . .
        . . . . f f b b f f . . . . . .
    `, SpriteKind.PJ1)

    console.log("ID:" + mySprite.id);
})
let mySprite: Sprite = null
let rand: Sprite = null
multiplayer.drawTitle("TEST", "MUTIPLAYER", 1)
multiplayer.sharedImgs([img`
    . . . . f f f f f . . . . . . .
    . . . f e e e e e f . . . . . .
    . . f d d d d e e e f . . . . .
    . c d f d d f d e e f f . . . .
    . c d f d d f d e e d d f . . .
    c d e e d d d d e e b d c . . .
    c d d d d c d d e e b d c . f f
    c c c c c d d d e e f c . f e f
    . f d d d d d e e f f . . f e f
    . . f f f f f e e e e f . f e f
    . . . . f e e e e e e e f f e f
    . . . f e f f e f e e e e f f .
    . . . f e f f e f e e e e f . .
    . . . f d b f d b f f e f . . .
    . . . f d d c d d b b d f . . .
    . . . . f f f f f f f f f . . .
`, img`
    . . . f 4 4 f f f f . . . . . .
    . . f 4 5 5 4 5 f b f f . . . .
    . . f 5 5 5 5 4 e 3 3 b f . . .
    . . f e 4 4 4 e 3 3 3 3 b f . .
    . . f 3 3 3 3 3 3 3 3 3 3 f . .
    . f 3 3 e e 3 b e 3 3 3 3 f . .
    . f 3 3 e e e f f 3 3 3 3 f . .
    . f 3 e e e f b f b b b b f . .
    . . f e 4 4 f 1 e b b b b f . .
    . . . f 4 4 4 4 f b b b b f f .
    . . . f e e e f f f b b b b f .
    . . . f d d d e 4 4 f b b f . .
    . . . f d d d e 4 4 e f f . . .
    . . f b d b d b e e b f . . . .
    . . f f 1 d 1 d 1 d f f . . . .
    . . . . f f b b f f . . . . . .
`])
multiplayer.waitForConnection(false)
