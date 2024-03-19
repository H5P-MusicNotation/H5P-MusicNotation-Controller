const fieldNameStub = "field-name-"
const interactiveNotations = ["interactiveNotation_modelSolution", "interactiveNotation_studentView"]

class Main {

    private parent;
    private field;
    private params;
    private setValue
    private container: HTMLElement
    private rootContentContainer: HTMLElement
    private selectInteractiveGroup: HTMLElement
    private interactionMode: string
    private studentMEIString: string
    private solutionMEIString: string
    private studentMEIDoc: Document
    private solutionMEIDoc: Document
    private studentSVG: HTMLElement
    private solutionSVG: HTMLElement
    private studentContainer: HTMLElement
    private solutionContainer: HTMLElement
    private copyButton: Element
    private alignmentUploadButton: Element
    private alignMap: string

    private checkDuration: boolean
    private checkOctave: boolean
    private checkHarmlabel: boolean
    private checkTextboxes: boolean

    /**
     * Creates the main Class.
     * Contains main interaction logic.
     *
     * @param {Object} parent
     * @param {Object} field
     * @param {string} params
     * @param {H5PEditor.SetParameters} setValue
     */
    constructor(parent, field, params, setValue) {
        this.parent = parent;
        this.field = field;
        this.studentMEIString = params;
        this.setValue = setValue;

        this.createContainer()
    }

    init() {
        //document.querySelector("#field-extratitle--1").setAttribute("value", "Test")
        this.update()
        this.setInteractiveNotationObserver()

        this.selectInteractiveGroup = this.rootContentContainer.querySelector(`.${fieldNameStub}selectInteractiveNotation select`) as HTMLSelectElement //this.rootContentContainer.parentElement.querySelector(`.${fieldNameStub}selectInteractiveNotation select`) as HTMLSelectElement
        var that = this
        this.selectInteractiveGroup.addEventListener("change", function (e: Event) {
            that.interactiveNotationToggleListeners(e)
        })
        if (this.selectInteractiveGroup.querySelector("[selected]").getAttribute("value") === "interact") {
            this.selectInteractiveGroup.dispatchEvent(new Event("change"))
        }
    }

    /**
     * Attach listeners and observers to container of notationWidget, when container exists.
     * Will listen for updates of the widget and update datastorage.
     */
    setInteractiveNotationObserver() {
        var that = this
        var processedElements = new Array<string>()
        var obs = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                var t = mutation.target as Element
                var meiContainerQuery: string
                var svgContainerQuery: string
                if (t.classList.contains("vibe-container") && interactiveNotations.some(ia => {
                    if (t.closest(`.${fieldNameStub}${ia}`) !== null && !processedElements.includes(ia)) {
                        processedElements.push(ia)
                        meiContainerQuery = ia.includes("modelSolution") ? `${fieldNameStub}solutionMEI input` : `${fieldNameStub}studentMEI input`
                        svgContainerQuery = ia.includes("modelSolution") ? `${fieldNameStub}solutionSVG input` : `${fieldNameStub}studentSVG input`
                        return true
                    }
                })) {
                    const widgetContainer = t.closest(".h5p-notation-widget")
                    widgetContainer?.addEventListener("notationWidgetUpdate", that.setMeiListenerFunction.bind(that))
                    const meiValue = this.rootContentContainer.querySelector(`.${meiContainerQuery}`).getAttribute("value")
                    const svgValue = this.rootContentContainer.querySelector(`.${svgContainerQuery}`).getAttribute("value")
                    if (meiValue && svgValue) {
                        widgetContainer?.dispatchEvent(new CustomEvent("loadMei", {
                            detail: {
                                mei: meiValue,
                                svg: svgValue,
                                isFullContainer: true

                            }
                        }))
                    }

                    // observer should only process for each widgetcontaier once
                    document.addEventListener("annotationCanvasChanged", that.setMeiListenerFunction.bind(that), true)
                    if (processedElements === interactiveNotations) {
                        obs.disconnect()
                    }

                    //observer to change strings ob harmony labels based on selected taks configuration (check harm labels)
                    var harmChangeObserver = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            var target = mutation.target as Element
                            if (target.classList.contains("labelDiv") && target.attributes.getNamedItem("contenteditable")?.value === "true" && that.checkHarmlabel) {
                                if (target.textContent === "") target.textContent = "?"
                                console.log("harmChangeObserver", mutation.target)
                            }
                        })
                    })

                    var studentContainer = widgetContainer.closest(".field-name-interactiveNotation_studentView")
                    if(studentContainer){
                        harmChangeObserver.observe(
                            widgetContainer,
                            { characterData: false, attributes: false, childList: true, subtree: true }
                        )
                    }
                }
            })
        })

        obs.observe(this.rootContentContainer, {
            childList: true,
            subtree: true
        })
    }

    /**
     * Container in which the widget will run.
     * Id is randomized so that async initalisation could work
     */
    createContainer(): HTMLElement {
        this.container = document.createElement("div")
        this.container.classList.add("field")
        this.container.classList.add("text")
        this.container.classList.add("h5p-musicnotation-controller")

        var subdiv = document.createElement("div")
        subdiv.classList.add("content")
        subdiv.classList.add("musicnotationControllerContainer")
        var idStump = "musicnotationControllerContainer"
        subdiv.id = idStump + "_" + this.generateUID()
        while (document.getElementById(subdiv.id) !== null) {
            subdiv.id = idStump + "_" + this.generateUID()
        }
        this.container.append(subdiv)
        return this.container
    }

    generateUID() {
        var firstPart = ((Math.random() * 46656) | 0).toString(36)
        var secondPart = ((Math.random() * 46656) | 0).toString(36)
        firstPart = ("000" + firstPart).slice(-3);
        secondPart = ("000" + secondPart).slice(-3);
        return firstPart + secondPart;
    }

    /**
     * Creates a button that copies the model solution to the student view.
     */
    createCopyButton() {
        this.copyButton = document.createElement("div")
        "h5peditor-button h5peditor-button-textual importance-high".split(" ").forEach(c => this.copyButton.classList.add(c))
        this.copyButton.setAttribute("role", "button")
        this.copyButton.textContent = "Copy Solution to Student View"
        this.solutionContainer.parentElement.insertAdjacentElement("afterend", this.copyButton)

        var that = this
        this.copyButton.addEventListener("click", function () {
            that.studentMEIString = that.solutionMEIString
            that.studentMEIDoc = that.solutionMEIDoc
            that.studentSVG = that.solutionSVG
            that.studentContainer = that.solutionContainer
            that.setMei(that.studentMEIString, "student")
            that.rootContentContainer.querySelector(`.${fieldNameStub}${interactiveNotations[1]} .h5p-notation-widget`).dispatchEvent(new CustomEvent("loadMei", {
                detail: {
                    mei: that.restoreXmlIdTags(that.studentMEIDoc),
                    svg: that.rootContentContainer.querySelector(`.${fieldNameStub}studentSVG input`).getAttribute("value"),
                    isFullContainer: true
                }
            }))
        })
    }

    createAlignmentUploadButton() {
        this.alignmentUploadButton = document.createElement("div")
        "h5peditor-button h5peditor-button-textual importance-high".split(" ").forEach(c => this.alignmentUploadButton.classList.add(c))
        this.alignmentUploadButton.setAttribute("role", "button")
        this.alignmentUploadButton.textContent = "Import Alignment"

        var alignemntInput = document.createElement("input")
        alignemntInput.setAttribute("id", "alignmentInput")
        alignemntInput.setAttribute("type", "file")
        alignemntInput.style.display = "none"
        alignemntInput.readOnly = false

        this.rootContentContainer.querySelector(`.${fieldNameStub}soundAlignmentJson`).parentElement.insertAdjacentElement("beforeend", this.alignmentUploadButton)
        this.rootContentContainer.querySelector(`.${fieldNameStub}soundAlignmentJson`).parentElement.insertAdjacentElement("beforeend", alignemntInput)

        var that = this
        this.alignmentUploadButton.addEventListener("click", function () {
            alignemntInput.setAttribute("accept", [".json"].join(", "))
            alignemntInput.click()
            alignemntInput.addEventListener("input", function (e) {
                var fr = new FileReader()
                const fileName = this.files[0].name
                fr.onload = function () {
                    that.alignMap = fr.result as string
                    const alignmentTextFieldInput = that.rootContentContainer.querySelector(`.${fieldNameStub}soundAlignmentJson input`)
                    alignmentTextFieldInput.setAttribute("value", that.alignMap)
                    alignmentTextFieldInput.dispatchEvent(new Event("change"))
                    if (!alignmentTextFieldInput.parentElement.parentElement.querySelector("#fileNameDiv")) {
                        const fileNameDiv = document.createElement("div")
                        fileNameDiv.setAttribute("id", "fileNameDiv")
                        alignmentTextFieldInput.parentElement.insertAdjacentElement("afterend", fileNameDiv)
                    }
                    alignmentTextFieldInput.parentElement.parentElement.querySelector("#fileNameDiv").textContent = fileName
                }
                fr.readAsText(this.files[0])
            }, false)
        })
    }

    /**
     * @returns 
     */
    validate(): Boolean {
        return true
    }

    remove() {
       
    }

    /**
     * This function is Called in VerovioScoreEditor, when MEI has changed
     */


    /**
     * Wrapper for setMei, if used for a listener.
     * Customevent will be called from notationWidget
     * @param e 
     */
    setMeiListenerFunction(e: CustomEvent | Event) {
        this.update()
        if (e.constructor.name === "CustomEvent") {
            var event = e as CustomEvent
            var fieldGroup = (e.target as Element).closest(".field.group")
            if (fieldGroup.classList.contains(`${fieldNameStub}${interactiveNotations[0]}`)) {
                this.setMei(event.detail.mei, "solution")
            } else if (fieldGroup.classList.contains(`${fieldNameStub}${interactiveNotations[1]}`)) {
                this.setMei(event.detail.mei, "student")
            }
        } else {
            this.setMei(this.solutionMEIString, "solution")
            this.setMei(this.studentMEIString, "student")
        }
    }

    /**
     * Change mei of related scoreView
     * @param mei 
     * @param scoreView
     */
    setMei(mei: string, scoreView: "student" | "solution"): void {
        if (!mei) return
        mei = this.cleanMEI(mei) //mei ? scoreMei : this.cleanMEI(mei)
        var scoreMei = mei
        var scoreDoc = new DOMParser().parseFromString(mei, "text/xml")
        var clear = false

        if (scoreView === "student") {
            this.studentMEIString = scoreMei || this.studentMEIString
            this.studentMEIDoc = scoreDoc || this.studentMEIDoc
            this.studentSVG = this.studentContainer.querySelector(".vibe-container") || this.studentSVG
        }
        if (scoreView === "solution") {
            this.solutionMEIString = scoreMei || this.solutionMEIString
            this.solutionMEIDoc = scoreDoc || this.solutionMEIDoc
            this.solutionSVG = this.solutionContainer.querySelector(".vibe-container") || this.solutionSVG
        }

        switch (this.interactionMode) {
            case "noInteraction":
                clear = true
                break
            case "interact":
                // if (this.checkHarmlabel && scoreView === "student") {
                //     this.studentMEIDoc.querySelectorAll("harm").forEach(h => {
                //         while (h.firstChild) {
                //             h.firstChild.remove()
                //         }
                //         h.textContent = "?"
                //         h.classList.add("questionBox")
                //     })
                // }
                break;
        }

        if (clear) {
            this.clearDataStorage()
        } else {
            this.setDataStorage()
        }
    }

    /**
     * Clean mei for DOMParser
     * @param mei 
     * @returns 
     */
    cleanMEI(mei: string): string {
        mei = mei.replace(/\xml:id/gi, "id"); // xml:id attribute will cause parser error
        mei = mei.replace(/\n/g, ""); // delete all unnecessary newline
        mei = mei.replace(/\s{2,}/g, ""); // delete all unnecessary whitespaces
        mei = mei.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, "\"");
        mei = mei.replace(/\xmlns=\"\"/g, "").replace(/\xmlns\s/g, "")
        return mei;
    }

    /**
     * Restore id to xml:id tags so that same ids will be used in verovio again
     * @param xmlDoc 
     * @returns 
     */
    restoreXmlIdTags(xmlDoc: Document, parse: Boolean = true) {
        var mei = new XMLSerializer().serializeToString(xmlDoc).replace(/\ id/gi, " xml:id");
        if (parse) {
            return new DOMParser().parseFromString(mei, "text/xml");
        }
        return mei
    }

    /**
     * Write values in dataStorage Fields (see semantics.json for reference)
     */
    setDataStorage() {

        // resources for solution
        if (this.solutionMEIDoc) {
            var solutionScoreInput = this.container.closest(".content").querySelector(`.${fieldNameStub}solutionMEI input`)
            solutionScoreInput?.setAttribute("value", new XMLSerializer().serializeToString(this.restoreXmlIdTags(this.solutionMEIDoc) as Document))
            solutionScoreInput?.dispatchEvent(new Event("change"))
        }

        if (this.solutionSVG) {
            var solutionSVGInput = this.container.closest(".content").querySelector(`.${fieldNameStub}solutionSVG input`)
            solutionSVGInput?.setAttribute("value", new XMLSerializer().serializeToString(this.solutionSVG))
            solutionSVGInput?.dispatchEvent(new Event("change"))
        }

        // resources for student view
        if (this.studentMEIDoc) {
            var studentScoreInput = this.container.closest(".content").querySelector(`.${fieldNameStub}studentMEI input`)
            // the class "original" will be used in the following tasks to determine if the element (note, chord, harm, rest) was already present in the original to not award points for these.
            this.studentMEIDoc.querySelectorAll("chord, note, rest, harm").forEach(el => {
                el.className = ""
                el.classList.add("original")
            })
            studentScoreInput?.setAttribute("value", new XMLSerializer().serializeToString(this.restoreXmlIdTags(this.studentMEIDoc) as Document))
            studentScoreInput?.dispatchEvent(new Event("change"))
        }

        if (this.studentSVG) {
            var studentSVGInput = this.container.closest(".content").querySelector(`.${fieldNameStub}studentSVG input`)
            studentSVGInput?.setAttribute("value", new XMLSerializer().serializeToString(this.studentSVG))
            studentSVGInput?.dispatchEvent(new Event("change"))
        }

        // console.log("datastorage set")
        // console.log("solutionScoreInput", solutionScoreInput?.getAttribute("value"))
        // console.log("solutionSVGInput", solutionSVGInput?.getAttribute("value"))
        // console.log("studentScoreInput", studentScoreInput?.getAttribute("value"))
        // console.log("studentSVGInput", studentSVGInput?.getAttribute("value"))
    }

    /**
     * Clear all inputs in dataStorage
     */
    clearDataStorage() {
        var solutionScoreInput = this.container.closest(".content").querySelector(`.${fieldNameStub}solutionMEI input`)
        solutionScoreInput?.removeAttribute("value")
        solutionScoreInput?.dispatchEvent(new Event("change"))

        var solutionSVGInput = this.container.closest(".content").querySelector(`.${fieldNameStub}solutionSVG input`)
        solutionSVGInput?.removeAttribute("value")
        solutionSVGInput?.dispatchEvent(new Event("change"))

        var studentScoreInput = this.container.closest(".content").querySelector(`.${fieldNameStub}studentMEI input`)
        studentScoreInput?.removeAttribute("value")
        studentScoreInput?.dispatchEvent(new Event("change"))

        var studentSVGInput = this.container.closest(".content").querySelector(`.${fieldNameStub}studentSVG input`)
        studentSVGInput?.removeAttribute("value")
        studentSVGInput?.dispatchEvent(new Event("change"))
    }

    /**
     * Listens for changes in tasktypeselector, applies logic of copying mei depending on selected task
     * @returns 
     */
    interactiveNotationToggleListeners(e: Event) {
        var that = this
        var t = e.target as HTMLSelectElement
        that.interactionMode = t.querySelectorAll("option")[t.selectedIndex].getAttribute("value")
        if (that.interactionMode === "interact" && !that.copyButton) {
            that.createCopyButton()
            that.createAlignmentUploadButton()

            that.checkOctave = that.rootContentContainer.querySelector(`.${fieldNameStub}checkOctavePosition input`).hasAttribute("checked")
            that.checkDuration = that.rootContentContainer.querySelector(`.${fieldNameStub}checkDuration input`).hasAttribute("checked")
            that.checkHarmlabel = that.rootContentContainer.querySelector(`.${fieldNameStub}checkHarmLabels input`).hasAttribute("checked")
            that.checkTextboxes = that.rootContentContainer.querySelector(`.${fieldNameStub}checkTextboxes input`).hasAttribute("checked")

            //listen for any changes from the configuration checklist and change boolen status for given members
            that.rootContentContainer.querySelectorAll(".boolean input").forEach(bi => {
                bi.addEventListener("change", function (e: Event) {
                    var t = e.target as HTMLInputElement
                    const fieldId = t.id.split("-")[1]

                    switch (fieldId) {
                        case "checkoctaveposition":
                            that.checkOctave = t.checked
                            break;
                        case "checkduration":
                            that.checkDuration = t.checked
                            break;
                        case "checkharmlabels":
                            that.checkHarmlabel = t.checked
                            break;
                        case "checktextboxes":
                            that.checkTextboxes = t.checked
                            break;

                    }
                })
            })
        } else {
            that.copyButton.remove()
        }
        that.setMei(that.solutionMEIString, "solution")
        that.setMei(that.studentMEIString, "student")
    }

    getContainer() {
        return this.container
    }

    update() {
        this.rootContentContainer = this.container.closest(".h5p-vtab-form.content") || this.container.closest(".tree")
        this.solutionContainer = this.rootContentContainer.querySelector(`.${fieldNameStub}${interactiveNotations[0]}`)
        this.studentContainer = this.rootContentContainer.querySelector(`.${fieldNameStub}${interactiveNotations[1]}`)
    }

}

export default Main