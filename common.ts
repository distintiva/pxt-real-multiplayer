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
 
namespace multiplayer {

    //- Image Syncing
    export interface IHash {
        [details: number]: Image;
    }

    // { image-id: Image}
    export let syncedImages: IHash = {};

    // Get an Image UID based on it pixels 
    // could be optimized
    export function getImageId(im: Image): number {
        let imcrc = 0;
        for (let f = 0; f < im.height; f++) {
            for (let c = f%2; c < im.width; c+=2) {
                let px = im.getPixel(f, c);
                imcrc +=px * ( c + f ) +1;
            }
        }
        return imcrc;
    }


}
