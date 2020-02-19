namespace SpriteKind {
    export const PJ1 = SpriteKind.create()
}
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    rand = sprites.create(img`
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
    `, SpriteKind.Enemy)
    rand.setPosition(Math.randomRange(0, 160), Math.randomRange(0, 120))
    rand.setVelocity(20, 0)
    multiplayer.syncThisSprite(rand)
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
multiplayer.waitForConnection(true)
