// tests go here; this will not be compiled when this package is used as an extension.
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {

})
multiplayer.onConnected(function () {
    scene.setBackgroundColor(7)
    mySprite = sprites.create(img`
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . f f f f f f . . . . . . . . . . . . . .
        . . f f e e e e f 2 f . . . . . . . . . . . . .
        . f f e e e e f 2 2 2 f . . . . . . . . . . . .
        . f e e e f f e e e e f . . . c c . . . . . . .
        . f f f f e e 2 2 2 2 e f . c d c . . . . . . .
        . f e 2 2 2 f f f f e 2 f c d d c . . . . . . .
        f f f f f f f e e e f f c d d c . . . . . . . .
        f f e 4 4 e b f 4 4 e c d d c . . . . . . . . .
        f e e 4 d 4 1 f d d e c d c . . . . . . . . . .
        . f e e e 4 d d d e d c c c . . . . . . . . . .
        . . f f e e 4 4 e 4 d d e . . . . . . . . . . .
        . . . f 2 2 2 2 4 4 e e . . . . . . . . . . . .
        . . . f 2 2 2 2 e 2 f . . . . . . . . . . . . .
        . . . f 4 4 4 4 5 5 f . . . . . . . . . . . . .
        . . . . f f f f f f . . . . . . . . . . . . . .
        . . . . . f f f . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . . . . . . . . . .
    `, SpriteKind.Player)
})
let mySprite: Sprite = null
multiplayer.drawTitle("TEST", "MUTIPLAYER", 1)
multiplayer.waitForConnection(true)
