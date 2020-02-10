namespace multiplayer {
    export class SpriteTracker {
        protected all: SpriteCollection[];

        constructor() {
            this.all = [];
        }

        createSprite(image: Image, kind: number, id?: number) {
            const s = sprites.create(image, kind);
            this.trackSprite(s, id);
            return s;
        }

        destroySprite(kind: number, id: number) {
            const s = this.getSprite(kind, id);
            if (s) s.destroy();
        }

        trackSprite(sprite: Sprite, id?: number) {
            let col = this.getCollection(sprite.kind());
            if (!col) {
                col = new SpriteCollection(sprite.kind());
                this.all.push(col);
            }
            col.add(sprite, id);
        }

        getCollection(kind: number) {
            return this.all.find(s => s.kind === kind);
        }

        getSprite(kind: number, id: number) {
            const col = this.getCollection(kind);
            if (col) return col.getById(id);
            return undefined;
        }

        destroyAll() {
            this.all.forEach(col => col.sprites.forEach(s => s.destroy()));
        }
    }

    export class SpriteCollection {
        public readonly sprites: Sprite[];
        protected nextId: number;

        constructor(public readonly kind: number) {
            this.nextId = 1;
            this.sprites = [];

            sprites.onDestroyed(kind, sprite => {
                this.remove(sprite);
            });
        }

        add(s: Sprite, id?: number) {
            s.data = id || this.nextId++;
            this.sprites.push(s);
        }

        remove(s: Sprite) {
            this.sprites.removeElement(s);
        }

        getById(id: number) {
            return this.sprites.find(s => s.data === id);
        }
    }
}
