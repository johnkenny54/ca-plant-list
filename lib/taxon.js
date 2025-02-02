import { HTML } from "./html.js";
import { RarePlants } from "./rareplants.js";

class Taxon {
    #genera;
    #name;
    #genus;
    #commonNames;
    #status;
    #jepsonID;
    #calRecNum;
    /**@type {string|undefined} */
    #cfSyn;
    #iNatID;
    /**@type {string|undefined} */
    #iNatSyn;
    #cch2id;
    #fnaName;
    #calscapeCN;
    #lifeCycle;
    #flowerColors;
    #bloomStart;
    #bloomEnd;
    #rpiID;
    #rankRPI;
    #cesa;
    #fesa;
    #rankCNDDB;
    #rankGlobal;
    /** @type {string[]} */
    #synonyms = [];
    /** @type {import("./photo.js").Photo[]}*/
    #photos = [];

    /**
     * @param {import("./index.js").TaxonData} data
     * @param {import("./genera.js").Genera} genera
     */
    constructor(data, genera) {
        this.#genera = genera;
        const name = data["taxon_name"];
        const commonNames = data["common name"];
        const cesa = data["CESA"];
        const fesa = data["FESA"];
        const rankGlobal = data["GRank"];
        const rankCNDDB = data["SRank"];
        this.#name = name;
        this.#genus = name.split(" ")[0];
        this.#commonNames = commonNames
            ? commonNames.split(",").map((t) => t.trim())
            : [];
        this.#status = data["status"];
        this.#jepsonID = data["jepson id"];
        this.#calRecNum = data["calrecnum"];
        this.#iNatID = data["inat id"];
        this.#cch2id = data.cch2_id;
        this.#fnaName = data.fna ?? "";
        this.#calscapeCN =
            data.calscape_cn === "" ? undefined : data.calscape_cn;
        this.#lifeCycle = data.life_cycle;
        const colors = data["flower_color"];
        this.#flowerColors = colors ? colors.split(",") : undefined;
        if (data["bloom_start"]) {
            this.#bloomStart = parseInt(data["bloom_start"]);
        }
        if (data["bloom_end"]) {
            this.#bloomEnd = parseInt(data["bloom_end"]);
        }
        this.#rpiID = data["RPI ID"];
        this.#rankRPI = data["CRPR"];
        this.#cesa = cesa ? cesa : undefined;
        this.#fesa = fesa ? fesa : undefined;
        this.#rankCNDDB = rankCNDDB ? rankCNDDB : undefined;
        this.#rankGlobal = rankGlobal ? rankGlobal : undefined;
        genera.addTaxon(this);
    }

    /**
     * @param {string} syn
     * @param {string} type
     */
    addSynonym(syn, type) {
        this.#synonyms.push(syn);
        switch (type) {
            case "CF":
                // Synonym is in Calflora format.
                this.#cfSyn = syn;
                break;
            case "INAT":
                // Synonyms should be in Jepson format, but store iNatName in iNat format (no var or subsp, space after x).
                this.#iNatSyn = syn;
                break;
        }
    }

    /**
     * @param {import("./photo.js").Photo} photo
     */
    addPhoto(photo) {
        this.#photos = this.#photos.concat([photo]);
    }

    /**
     * @returns {import("./photo.js").Photo[]}
     */
    getPhotos() {
        return this.#photos;
    }

    getBaseFileName() {
        // Convert spaces to "-" and remove ".".
        return this.#name.replaceAll(" ", "-").replaceAll(".", "");
    }

    /**
     * @returns {number|undefined}
     */
    getBloomEnd() {
        return this.#bloomEnd;
    }

    /**
     * @returns {number|undefined}
     */
    getBloomStart() {
        return this.#bloomStart;
    }

    getCalfloraName() {
        if (this.#cfSyn) {
            return this.#cfSyn;
        }
        return this.getName().replace(" subsp.", " ssp.").replace("×", "X");
    }

    getCalfloraID() {
        return this.#calRecNum;
    }

    getCalfloraTaxonLink() {
        const calfloraID = this.getCalfloraID();
        if (!calfloraID) {
            return;
        }
        const link = HTML.getLink(
            "https://www.calflora.org/app/taxon?crn=" + calfloraID,
            "Calflora",
            {},
            true,
        );
        return this.#cfSyn ? link + " (" + this.#cfSyn + ")" : link;
    }

    getCalscapeCommonName() {
        return this.#calscapeCN;
    }

    getCalscapeName() {
        return Taxon.getCalscapeName(this.getName());
    }

    /**
     * @param {string} name
     */
    static getCalscapeName(name) {
        return name.replace(" subsp.", " ssp.");
    }

    /**
     * @returns {string}
     */
    getCCH2ID() {
        return this.#cch2id;
    }

    /**
     * @returns {string}
     */
    getCESA() {
        return this.#cesa ?? "";
    }

    /**
     * @returns {string}
     */
    getCNDDBRank() {
        return this.#rankCNDDB ?? "";
    }

    getCommonNames() {
        return this.#commonNames;
    }

    getFamily() {
        return this.getGenus().getFamily();
    }

    /**
     * @returns {string}
     */
    getFESA() {
        return this.#fesa ?? "";
    }

    getFileName(ext = "html") {
        return this.getBaseFileName() + "." + ext;
    }

    /**
     * @returns {string}
     */
    getFNAName() {
        if (this.#fnaName === "true") {
            return this.getName();
        }
        return this.#fnaName;
    }

    getFlowerColors() {
        return this.#flowerColors;
    }

    getGenus() {
        return this.#genera.getGenus(this.#genus);
    }

    getGenusName() {
        return this.#genus;
    }

    /**
     * @returns {string}
     */
    getGlobalRank() {
        return this.#rankGlobal ?? "";
    }

    /**
     *
     * @param {boolean|string|undefined} href
     * @param {boolean} includeRPI
     */
    getHTMLLink(href = true, includeRPI = true) {
        href = href ? "./" + this.getFileName() : undefined;
        let className = this.isNative() ? "native" : "non-native";
        let isRare = false;
        if (includeRPI && this.isRare()) {
            isRare = true;
            className += " rare";
        }
        const attributes = { class: className };
        const link = HTML.wrap(
            "span",
            HTML.getLink(href, this.getName()),
            attributes,
        );
        if (isRare) {
            return HTML.getToolTip(link, this.getRPIRankAndThreatTooltip(), {
                icon: false,
            });
        }
        return link;
    }

    getINatID() {
        return this.#iNatID;
    }

    getINatName() {
        const name = this.#iNatSyn ? this.#iNatSyn : this.getName();
        return name.replace(/ (subsp|var)\./, "").replace("×", "× ");
    }

    /**
     * @returns {string|undefined}
     */
    getINatSyn() {
        return this.#iNatSyn;
    }

    getINatTaxonLink() {
        const iNatID = this.getINatID();
        if (!iNatID) {
            return "";
        }
        const link = HTML.getLink(
            "https://www.inaturalist.org/taxa/" + iNatID,
            "iNaturalist",
            {},
            true,
        );
        return this.#iNatSyn ? link + " (" + this.#iNatSyn + ")" : link;
    }

    /**
     * @returns {string}
     */
    getJepsonID() {
        return this.#jepsonID;
    }

    getLifeCycle() {
        return this.#lifeCycle;
    }

    getName() {
        return this.#name;
    }

    getRPIID() {
        return this.#rpiID;
    }

    /**
     * @returns {string}
     */
    getRPIRank() {
        if (!this.#rankRPI) {
            return this.#rankRPI;
        }
        return this.#rankRPI.split(".")[0];
    }

    /**
     * @returns {string}
     */
    getRPIRankAndThreat() {
        return this.#rankRPI;
    }

    /**
     * @deprecated
     */
    getRPIRankAndThreatTooltip() {
        return RarePlants.getRPIRankAndThreatDescriptions(
            this.getRPIRankAndThreat(),
        ).join("<br>");
    }

    /**
     * @deprecated
     */
    getRPITaxonLink() {
        const rpiID = this.getRPIID();
        if (!rpiID) {
            return "";
        }
        const link = HTML.getLink(
            "https://rareplants.cnps.org/Plants/Details/" + rpiID,
            "CNPS Rare Plant Inventory",
            {},
            true,
        );
        return link;
    }

    getStatus() {
        return this.#status;
    }

    /**
     * @param {import("./config.js").Config} config
     * @returns {string}
     */
    getStatusDescription(config) {
        switch (this.#status) {
            case "N":
                return "Native";
            case "NC":
                return config.getLabel("status-NC", "Introduced");
            case "U":
                return "Nativity Uncertain";
            case "X":
                return "Introduced";
        }
        throw new Error(this.#status);
    }

    getSynonyms() {
        return this.#synonyms;
    }

    isCANative() {
        return this.#status === "N" || this.#status === "NC";
    }

    /**
     * Determine whether a species is a local native.
     * @returns {boolean} true if taxon is a local native; false if not a CA native, or native elsewhere in CA.
     */
    isNative() {
        return this.#status === "N";
    }

    isRare() {
        return this.getRPIRank() !== undefined;
    }

    shouldHaveFlowers() {
        const sectionName = this.getFamily().getSectionName();
        switch (sectionName) {
            case "Ceratophyllales":
            case "Eudicots":
            case "Magnoliids":
            case "Monocots":
            case "Nymphaeales":
                return true;
            case "Ferns":
            case "Gymnosperms":
            case "Lycophytes":
                return false;
            default:
                throw new Error(sectionName);
        }
    }
}

export { Taxon };
