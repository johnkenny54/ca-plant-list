import * as fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { Config, CSV, Files, Taxa } from "@ca-plant-list/ca-plant-list";

import { Image } from "./image.js";
import { EBook } from "./ebook.js";

class Images {

    #contentDir;
    #images = {};

    constructor( contentDir ) {
        this.#contentDir = contentDir;
    }

    async createImages() {

        const photoDirSrc = "external_data/photos";
        const imagePrefix = "i";
        const photoDirTarget = this.#contentDir + "/" + imagePrefix;
        fs.mkdirSync( photoDirSrc, { recursive: true } );
        fs.mkdirSync( photoDirTarget, { recursive: true } );

        const rows = CSV.parseFile( Config.getPackageDir() + "/data", "photos.csv" );
        for ( const row of rows ) {

            const name = row[ "taxon_name" ];
            const taxon = Taxa.getTaxon( name );
            if ( !taxon ) {
                continue;
            }

            let imageList = this.#images[ name ];
            if ( !imageList ) {
                imageList = [];
                this.#images[ name ] = imageList;
            }

            const src = new URL( row[ "source" ] );
            const parts = path.parse( src.pathname ).dir.split( "/" );
            const prefix = src.host.includes( "calflora" ) ? "cf-" : "inat-";
            const filename = prefix + parts.slice( -1 )[ 0 ] + ".jpg";
            const srcFileName = photoDirSrc + "/" + filename;
            const targetFileName = photoDirTarget + "/" + filename;

            if ( !fs.existsSync( srcFileName ) ) {
                // File is not there; retrieve it.
                console.log( "retrieving " + srcFileName );
                await Files.fetch( src, srcFileName );
            }

            await new sharp( srcFileName ).resize( { width: 400 } ).jpeg( { quality: 40 } ).toFile( targetFileName );

            imageList.push( new Image( imagePrefix + "/" + filename, row[ "credit" ] ) );

        }

        this.#getIllustrations( this.#contentDir );

    }

    #getIllustrations() {
        Files.copyDir( Config.getPackageDir() + "/data/illustrations/optimized", this.#contentDir + "/i" );
    }

    getManifestEntries() {

        const entries = [];
        const images = Files.getDirEntries( this.#contentDir + "/i" ).sort();

        for ( let index = 0; index < images.length; index++ ) {
            const fileName = images[ index ];
            const ext = fileName.split( "." )[ 1 ];
            entries.push( EBook.getManifestEntry( "i" + index, "i/" + fileName, EBook.getMediaTypeForExt( ext ) ) );
        }

        return entries.join( "" );
    }

}

export { Images };