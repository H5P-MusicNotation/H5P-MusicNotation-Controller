"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fieldNameStub = "field-name-";
class Main {
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
        this.viewMei = params;
        this.setValue = setValue;
        this.createContainer();
    }
    init() {
        this.setInteractiveNotationObserver();
        // tree class is root object to all elements within the content creating dialog
        this.tree = this.container.closest(".tree");
        this.interactiveNotation = this.tree.querySelector("." + fieldNameStub + "interactiveNotation");
        this.annotationFieldGroup = this.tree.querySelector("." + fieldNameStub + "annotationFieldGroup"); // this field will be used to save the annotationcanvas as string. will be parsed and replaced in task type
        this.taskTypeGroup = this.tree.parentElement.querySelector("." + fieldNameStub + "selectTaskType");
        if (this.taskTypeGroup !== null) {
            this.taskTypeChange();
        }
    }
    /**
     * Attach listener to container of notationWidget, when container exists.
     * Will listen for updates of the widget and update datastorage.
     */
    setInteractiveNotationObserver() {
        var that = this;
        var firstRun = true;
        var obs = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                var _a;
                var t = mutation.target;
                if (t.classList.contains("vse-container") && t.closest("." + fieldNameStub + "interactiveNotation") !== null) {
                    if (firstRun) {
                        (_a = t.closest(".h5p-notation-widget")) === null || _a === void 0 ? void 0 : _a.addEventListener("notationWidgetUpdate", that.setMeiListenerFunction.bind(that));
                        document.addEventListener("annotationCanvasChanged", that.setMeiListenerFunction.bind(that), true);
                        firstRun = false;
                        obs.disconnect();
                    }
                }
            });
        });
        obs.observe(document, {
            childList: true,
            subtree: true
        });
    }
    /**
     * Container in which the widget will run.
     * Id is randomized so that async initalisation could work
     */
    createContainer() {
        this.container = document.createElement("div");
        this.container.classList.add("field");
        this.container.classList.add("text");
        this.container.classList.add("h5p-as4l-controller");
        var subdiv = document.createElement("div");
        subdiv.classList.add("content");
        subdiv.classList.add("as4lControllerContainer");
        var idStump = "as4lControllerContainer";
        subdiv.id = idStump + "_" + this.generateUID();
        while (document.getElementById(subdiv.id) !== null) {
            subdiv.id = idStump + "_" + this.generateUID();
        }
        this.container.append(subdiv);
        return this.container;
    }
    generateUID() {
        var firstPart = ((Math.random() * 46656) | 0).toString(36);
        var secondPart = ((Math.random() * 46656) | 0).toString(36);
        firstPart = ("000" + firstPart).slice(-3);
        secondPart = ("000" + secondPart).slice(-3);
        return firstPart + secondPart;
    }
    /**
     * @returns
     */
    validate() {
        return true;
    }
    remove() {
        var _a;
        (_a = this.vse) === null || _a === void 0 ? void 0 : _a.getCore().getWindowHandler().removeListeners(); // why ist this instance still active? deleting the instance does nothing
    }
    /**
     * This function is Called in VerovioScoreEditor, when MEI has changed
     */
    /**
     * Wrapper for setMei, if used for a listener
     * @param e
     */
    setMeiListenerFunction(e) {
        if (e.constructor.name === "CustomEvent") {
            var event = e;
            this.setMei(event.detail.mei);
        }
        else {
            this.setMei();
        }
    }
    /**
     * Change mei of viewScore according to selected task type
     * @param mei
     */
    setMei(mei = null) {
        mei = mei === null ? this.viewMei : this.cleanMEI(mei);
        this.viewMei = mei;
        var dispatch = false;
        this.viewScore = new DOMParser().parseFromString(mei, "text/xml");
        var clear = false;
        switch (this.taskType) { // TODO: Change mei according to tasktype. this will be copied to answerScore
            case "noInteraction":
                clear = true;
                break;
            case "harmLabels":
                this.viewScore.querySelectorAll("harm").forEach(h => {
                    while (h.firstChild) {
                        h.firstChild.remove();
                    }
                    h.textContent = "?";
                    h.classList.add("questionBox");
                });
                dispatch = true;
                break;
            case "chords":
                this.viewScore.querySelectorAll("note, chord").forEach(n => {
                    if (n.parentElement.tagName === "chord")
                        return;
                    var e = n;
                    e.removeAttribute("oct");
                    e.removeAttribute("pname");
                    var rest = document.createElement("rest");
                    for (var i = 0; i < e.attributes.length; i++) {
                        rest.setAttribute(e.attributes.item(i).name, e.attributes.item(i).value);
                    }
                    n.replaceWith(rest);
                });
                dispatch = true;
                break;
            case "score":
                break;
            case "analysisText":
                dispatch = true;
                break;
        }
        if (dispatch) {
            var ce = new CustomEvent("solutionMEIChanged", {
                detail: {
                    mei: this.restoreXmlIdTags(this.viewScore, false)
                }
            });
            this.ttselect.dispatchEvent(ce);
        }
        if (clear) {
            this.clearDataStorage();
        }
        else {
            this.setDataStorage();
        }
    }
    /**
     * Clean mei for DOMParser
     * @param mei
     * @returns
     */
    cleanMEI(mei) {
        mei = mei.replace(/\xml:id/gi, "id"); // xml:id attribute will cause parser error
        mei = mei.replace(/\n/g, ""); // delete all unnecessary newline
        mei = mei.replace(/\s{2,}/g, ""); // delete all unnecessary whitespaces
        mei = mei.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, "\"");
        mei = mei.replace(/\xmlns=\"\"/g, "").replace(/\xmlns\s/g, "");
        return mei;
    }
    /**
     * Restore id to xml:id tags so that same ids will be used in verovio again
     * @param xmlDoc
     * @returns
     */
    restoreXmlIdTags(xmlDoc, parse = true) {
        var mei = new XMLSerializer().serializeToString(xmlDoc).replace(/\ id/gi, " xml:id");
        if (parse) {
            return new DOMParser().parseFromString(mei, "text/xml");
        }
        return mei;
    }
    /**
     * Write values in dataStorage Fields (see semantics.json for reference)
     */
    setDataStorage() {
        if (this.viewScore != undefined) {
            var viewScoreInput = document.querySelector("." + fieldNameStub + "viewScore input");
            viewScoreInput === null || viewScoreInput === void 0 ? void 0 : viewScoreInput.setAttribute("value", new XMLSerializer().serializeToString(this.restoreXmlIdTags(this.viewScore)));
            viewScoreInput === null || viewScoreInput === void 0 ? void 0 : viewScoreInput.dispatchEvent(new Event("change"));
        }
        var annotationCanvas = document.querySelector("." + fieldNameStub + "interactiveNotation #annotationCanvas");
        if (annotationCanvas !== null) {
            var annotaionFieldInput = document.querySelector("." + fieldNameStub + "annotationField input");
            annotaionFieldInput === null || annotaionFieldInput === void 0 ? void 0 : annotaionFieldInput.setAttribute("value", new XMLSerializer().serializeToString(annotationCanvas));
            annotaionFieldInput === null || annotaionFieldInput === void 0 ? void 0 : annotaionFieldInput.dispatchEvent(new Event("change"));
        }
        //     console.log("datastorage set")
        //     console.log("viewScore", viewScoreInput?.getAttribute("value"))
        //     console.log("annotationField", annotaionFieldInput?.getAttribute("value"))
    }
    /**
     * Clear all inputs in dataStorage
     */
    clearDataStorage() {
        var viewScoreInput = document.querySelector("." + fieldNameStub + "viewScore input");
        viewScoreInput === null || viewScoreInput === void 0 ? void 0 : viewScoreInput.removeAttribute("value");
        viewScoreInput === null || viewScoreInput === void 0 ? void 0 : viewScoreInput.dispatchEvent(new Event("change"));
        var annotaionFieldInput = document.querySelector("." + fieldNameStub + "annotationField input");
        annotaionFieldInput === null || annotaionFieldInput === void 0 ? void 0 : annotaionFieldInput.removeAttribute("value");
        annotaionFieldInput === null || annotaionFieldInput === void 0 ? void 0 : annotaionFieldInput.dispatchEvent(new Event("change"));
    }
    /**
     * Listens for changes in tasktypeselector, applies logic of copying mei depending on selected task
     * @returns
     */
    taskTypeChange() {
        var that = this;
        this.ttselect = this.taskTypeGroup.querySelector("select");
        this.taskType = this.ttselect.querySelectorAll("option")[this.ttselect.selectedIndex].getAttribute("value");
        this.ttselect.addEventListener("change", function (e) {
            var t = e.target;
            that.taskType = t.querySelectorAll("option")[t.selectedIndex].getAttribute("value");
            that.setMei();
        });
        this.ttselect.addEventListener("solutionMEIChanged", function (ce) {
            var _a;
            (_a = that.vse) === null || _a === void 0 ? void 0 : _a.getCore().loadData("", ce.detail.mei, false, "svg_output").then(() => {
                if (that.taskType === "harmLabel") {
                    that.container.querySelectorAll("#interactionOverlay .harm").forEach(h => {
                        h.classList.add("questionBox");
                    });
                }
            });
        });
    }
    getContainer() {
        return this.container;
    }
}
exports.default = Main;
