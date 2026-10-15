//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// DocSpace returns at most 100 entries per request.
const PAGE_SIZE = 100

/**
 * Returns the filters for the page that Zapier requests. Zapier requests the
 * next pages only for dropdowns. Polling always requests the first page.
 * @param {Bundle} bundle
 * @returns {{count: number, startIndex: number}}
 */
function pageFilters(bundle) {
  const page = Number(bundle.meta && bundle.meta.page) || 0
  return {
    count: PAGE_SIZE,
    startIndex: page * PAGE_SIZE
  }
}

module.exports = {
  PAGE_SIZE,
  pageFilters
}
