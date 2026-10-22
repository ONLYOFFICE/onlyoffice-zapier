//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

/**
 * A text field to show instead of an empty list, when the user has no rights.
 * @param {string} text
 * @returns {Object[]}
 */
function noRightsField(text) {
  return [{
    helpText: text,
    key: "noRights",
    label: "Not available",
    type: "copy"
  }]
}

module.exports = {
  noRightsField
}
