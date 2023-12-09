# Music Notation Controller
=======

This H5P Editor module helps organize and save SVG and MEI files for use in the H5P Music Notation Module.
**This module is necessary for H5P Music Notation to work! Click on the module name for the documentation of [Music Notation](https://github.com/H5P-MusicNotation/H5P-MusicNotation).**

In the task creation form, the file contents are stored as text in hidden text boxes and can then be used as parameters during actual task handling. 
The DOM for this code is created in the Music Notation module based on the following entry in the semantics.json:

`
{
    "name": "musicnotationControllerGroup",
    "type": "group",
    "description": "This group exists to bind and execute control logic for the task creation of the MusicNotation package. This group will be visually hidden.",
    "fields": [
        {
            "name": "musicnotationControllerWidget",
            "type": "text",
            "widget": "musicnotationController",
            "optional": true,
            "description": "This field holds the widget for the controller logic."
        },
        {
            "name": "dataStorageGroup",
            "type": "group",
            "description": "In this group, dummy fields are created to transfer additional data from content creation to content view.",
            "fields": [
                {
                    "name": "studentSVG",
                    "type": "text",
                    "optional": true
                },
                {
                    "name": "studentMEI",
                    "type": "text",
                    "optional": true
                },
                {
                    "name": "solutionSVG",
                    "type": "text",
                    "optional": true
                },
                {
                    "name": "solutionMEI",
                    "type": "text",
                    "optional": true
                }
            ]
        }
    ]
}
`