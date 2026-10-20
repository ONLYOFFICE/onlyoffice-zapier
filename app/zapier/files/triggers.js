//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const {
  ACTIVATION_STATUS,
  aiRoomRoles,
  Client,
  collaborationRoomRoles,
  customRoomRoles,
  fillingFormsRoomRoles,
  isAiRoom,
  isCollaborationRoom,
  isCustomRoom,
  isFillingFormsRoom,
  isPublicRoom,
  isVirtualDataRoom,
  normalizeId,
  publicRoomRoles,
  REMOVED_USER_ID,
  ROOM_MANAGER,
  stripExtension,
  virtualDataRoomRoles
} = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { createWebhookTrigger } = require("../webhooks/hooks.js")
const { pageFilters } = require("../pagination.js")
const {
  FILE_CREATED,
  FILE_DELETED,
  FILE_MOVED,
  FILE_UPDATED,
  FILE_UPLOADED,
  FOLDER_CREATED,
  FOLDER_DELETED,
  FOLDER_MOVED,
  FOLDER_UPDATED,
  FORM_FILLED_OUT,
  FORM_SUBMITTED,
  ROOM_ARCHIVED,
  ROOM_UPDATED
} = require("../../docspace/webhooks/events.js")

/**
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/files/files.js").PathParts} PathParts
 * @typedef {import("../../docspace/files/files.js").RoleData} RoleData
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @typedef {Object} FileCreatedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileDeletedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileCreatedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileDeletedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FilesListFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FilesListFromMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderCreatedFields
 * @property {(number|string)=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderCreatedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderDeletedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderDeletedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {object} ShareRolesFields
 * @property {number} roomId
 * @property {string=} userId
 */

/**
 * @typedef {Object} UserInvitedFields
 * @property {number} id
 * @property {boolean} active
 */

/**
 * @param {FileData} file
 * @returns {FileData}
 */
function normalizeFile(file) {
  file.title = stripExtension(file.title)
  file.id = normalizeId(file.id)
  return file
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileCreatedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileCreated(z, bundle) {
  if (!bundle.inputData.folderId) {
    bundle.inputData.folderId = bundle.inputData.id
  }
  if (bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const filters = {
      ...pageFilters(bundle),
      filterType: "FilesOnly",
      sortBy: "DateAndTimeCreation",
      sortOrder: "descending"
    }
    const filesList = await files.listFiles(bundle.inputData.folderId, filters)
    return filesList.files.slice(0, 100).map(normalizeFile)
  }
  throw new z.errors.HaltedError("Select a room or a folder.")
}

const fileCreated = createWebhookTrigger(
  "fileCreated",
  "File Created",
  "Triggers when a file is created or uploaded in a room.",
  [
    FILE_CREATED,
    FILE_UPLOADED
  ],
  {
    filters: { rootFolderType: 14 },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileCreated,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileCreatedInMyDocumentsFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileCreatedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFileCreated(z, bundle)
}

const fileCreatedInMyDocuments = createWebhookTrigger(
  "fileCreatedInMyDocuments",
  "File Created in Files Section",
  "Triggers when a file is created or uploaded in the Files section.",
  [
    FILE_CREATED,
    FILE_UPLOADED
  ],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to watch the whole section.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileCreatedInMyDocuments,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileDeletedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileDeleted(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    filterType: "FilesOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const trash = await files.listTrash(filters)
  trash.files.forEach(normalizeFile)
  if (bundle.inputData.id || bundle.inputData.folderId) {
    if (!bundle.inputData.folderId) {
      bundle.inputData.folderId = bundle.inputData.id
    }
    return trash.files.filter((item) => String(item.originId) === String(bundle.inputData.folderId))
  }
  return trash.files
}

const fileDeleted = createWebhookTrigger(
  "fileDeleted",
  "File Deleted",
  "Triggers when a file is moved to Trash.",
  [FILE_DELETED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileDeleted,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileDeletedInMyDocumentsFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileDeletedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFileDeleted(z, bundle)
}

const fileDeletedInMyDocuments = createWebhookTrigger(
  "fileDeletedInMyDocuments",
  "File Deleted from Files Section",
  "Triggers when a file from the Files section is moved to Trash.",
  [FILE_DELETED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to watch the whole section.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileDeletedInMyDocuments,
    sample: samples.file
  }
)

/**
 * Lists the files of the selected folder or room, or of the Files section if
 * nothing is selected. Recently changed files go first.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileCreatedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileUpdated(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  let folderId = bundle.inputData.folderId || bundle.inputData.id
  if (!folderId) {
    const section = await files.myDocumentsSection()
    folderId = section.pathParts[0].id
  }
  const filters = {
    ...pageFilters(bundle),
    filterType: "FilesOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const filesList = await files.listFiles(folderId, filters)
  return filesList.files.slice(0, 100).map(normalizeFile)
}

const fileUpdated = createWebhookTrigger(
  "fileUpdated",
  "File Updated",
  "Triggers when a file is changed, for example edited, renamed or restored to an earlier version.",
  [FILE_UPDATED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileUpdated,
    sample: samples.file
  }
)

// DocSpace doesn't keep a history of moves, so the test records of the Zap
// editor are the recently changed files of the selected place.
const fileMoved = createWebhookTrigger(
  "fileMoved",
  "File Moved",
  "Triggers when a file is moved to another folder or room.",
  [FILE_MOVED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room the file is moved to. Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "The folder the file is moved to. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileUpdated,
    sample: samples.file
  }
)

const filesList = {
  display: {
    description: "Hidden trigger to get a list of files from a folder or room.",
    hidden: true,
    label: "List of Files"
  },
  key: "filesList",
  noun: "File",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FilesListFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      bundle.inputData.folderId = bundle.inputData.folderId || bundle.inputData.id
      return performFileCreated(z, bundle)
    },
    sample: samples.file
  }
}

const filesListFromMyDocuments = {
  display: {
    description: "Hidden trigger to get a list of files from the Files section.",
    hidden: true,
    label: "List of Files from Files Section"
  },
  key: "filesListFromMyDocuments",
  noun: "File",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FilesListFromMyDocumentsFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return performFileCreated(z, bundle)
    },
    sample: samples.file
  }
}

const filteredSections = {
  display: {
    description: "Hidden trigger to get the workspace sections.",
    hidden: true,
    label: "Sections"
  },
  key: "filteredSections",
  noun: "Section",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<PathParts[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const sections = await files.listSections()
      return sections.map((section) => ({
        id: Number(section.pathParts[0].id),
        title: section.pathParts[0].title
      }))
    },
    sample: samples.pathParts
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderCreated(z, bundle) {
  if (!bundle.inputData.id) {
    bundle.inputData.id = bundle.inputData.folderId
  }
  if (bundle.inputData.id) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const filters = {
      ...pageFilters(bundle),
      filterType: "FoldersOnly",
      sortBy: "DateAndTimeCreation",
      sortOrder: "descending"
    }
    const folders = await files.listFolders(bundle.inputData.id, filters)
    folders.folders.forEach((folder) => {
      folder.id = normalizeId(folder.id)
    })
    return folders.folders.slice(0, 100)
  }
  throw new z.errors.HaltedError("Select a room or a folder.")
}

const folderCreated = createWebhookTrigger(
  "folderCreated",
  "Folder Created",
  "Triggers when a folder is created in a room.",
  [FOLDER_CREATED],
  {
    filters: { rootFolderType: 14 },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderCreated,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderCreatedInMyDocumentsFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderCreatedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFolderCreated(z, bundle)
}

const folderCreatedInMyDocuments = createWebhookTrigger(
  "folderCreatedInMyDocuments",
  "Folder Created in Files Section",
  "Triggers when a folder is created in the Files section.",
  [FOLDER_CREATED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to watch the whole section.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderCreatedInMyDocuments,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderDeletedFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderDeleted(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    filterType: "FoldersOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const trash = await files.listTrash(filters)
  trash.folders.forEach((folder) => {
    folder.id = normalizeId(folder.id)
  })
  if (bundle.inputData.folderId) {
    return trash.folders.filter((item) => String(item.originId) === String(bundle.inputData.folderId))
  } else if (bundle.inputData.id) {
    return trash.folders.filter((item) => String(item.originId) === String(bundle.inputData.id))
  }
  return trash.folders
}

const folderDeleted = createWebhookTrigger(
  "folderDeleted",
  "Folder Deleted",
  "Triggers when a folder is moved to Trash.",
  [FOLDER_DELETED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderDeleted,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderDeletedInMyDocumentsFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderDeletedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFolderDeleted(z, bundle)
}

const folderDeletedInMyDocuments = createWebhookTrigger(
  "folderDeletedInMyDocuments",
  "Folder Deleted from Files Section",
  "Triggers when a folder from the Files section is moved to Trash.",
  [FOLDER_DELETED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to watch the whole section.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderDeletedInMyDocuments,
    sample: samples.folder
  }
)

/**
 * Lists the folders of the selected folder or room, or of the Files section if
 * nothing is selected. Recently changed folders go first.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderUpdated(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  let folderId = bundle.inputData.folderId || bundle.inputData.id
  if (!folderId) {
    const section = await files.myDocumentsSection()
    folderId = section.pathParts[0].id
  }
  const filters = {
    ...pageFilters(bundle),
    filterType: "FoldersOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const folders = await files.listFolders(folderId, filters)
  folders.folders.forEach((folder) => {
    folder.id = normalizeId(folder.id)
  })
  return folders.folders.slice(0, 100)
}

const folderUpdated = createWebhookTrigger(
  "folderUpdated",
  "Folder Updated",
  "Triggers when a folder is changed, for example renamed.",
  [FOLDER_UPDATED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderUpdated,
    sample: samples.folder
  }
)

// DocSpace doesn't keep a history of moves, so the test records of the Zap
// editor are the recently changed folders of the selected place.
const folderMoved = createWebhookTrigger(
  "folderMoved",
  "Folder Moved",
  "Triggers when a folder is moved to another folder or room.",
  [FOLDER_MOVED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room the folder is moved to. Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "The folder the folder is moved to. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    noun: "Folder",
    performList: performFolderUpdated,
    sample: samples.folder
  }
)

/**
 * @param {any} form
 * @returns {any}
 */
function normalizeForm(form) {
  normalizeFile(form)
  // DocSpace always sends the original form, but an event without it must not
  // fail the run.
  if (form.originalForm && form.originalForm.title) {
    normalizeFile(form.originalForm)
  }
  return form
}

// The type of the "Complete" folder of form filling rooms.
const COMPLETE_FOLDER_TYPE = 25

/**
 * @typedef {Object} FormSubmittedFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string=} formId
 */

/**
 * Lists the filled forms of the selected room with their original forms, like
 * the webhook returns them. Form filling rooms keep the filled forms in
 * subfolders of the "Complete" folder, one subfolder for each original form,
 * together with a spreadsheet of the answers.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FormSubmittedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFormSubmitted(z, bundle) {
  if (!bundle.inputData.id) {
    return []
  }
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const room = await files.listFolders(Number(bundle.inputData.id), { filterType: "FoldersOnly" })
  const complete = room.folders.find((folder) => Number(folder.type) === COMPLETE_FOLDER_TYPE)
  if (!complete) {
    return []
  }
  const done = await files.listFolders(complete.id, { filterType: "FoldersOnly" })
  // Like the webhook, the original form must be in the selected folder, or at
  // the top level of the room.
  const parentId = String(bundle.inputData.folderId || bundle.inputData.id)
  /** @type {FileData[]} */
  const result = []
  for (const folder of done.folders) {
    const { originalFormId } = folder
    if (!originalFormId) {
      continue
    }
    if (bundle.inputData.formId && String(originalFormId) !== String(bundle.inputData.formId)) {
      continue
    }
    const original = await files.fileInfo(originalFormId)
    if (String(original.folderId) !== parentId) {
      continue
    }
    const filters = {
      filterType: "FilesOnly",
      sortBy: "DateAndTimeCreation",
      sortOrder: "descending"
    }
    const forms = await files.listFiles(folder.id, filters)
    forms.files
      .filter((form) => form.fileExst === ".pdf")
      .forEach((form) => result.push(normalizeForm({ ...form, originalForm: { ...original } })))
  }
  return result
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
    .slice(0, 100)
}

const formSubmitted = createWebhookTrigger(
  "formSubmitted",
  "Form Submitted",
  "Triggers when a form is filled out and submitted.",
  [FORM_SUBMITTED],
  {
    filters: { entryField: "formId" },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        altersDynamicFields: true,
        dynamic: "foldersList.id.title",
        helpText: "A folder with forms. Leave empty to watch only the forms at the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        helpText: "Leave empty to watch all forms of the room or folder.",
        key: "formId",
        label: "Form",
        type: "string"
      }
    ],
    normalize: normalizeForm,
    noun: "Form",
    performList: performFormSubmitted,
    sample: samples.submittedForm
  }
)

// The form filling status of a form that all roles have filled out.
const COMPLETE_FORM_STATUS = 4

/**
 * Lists the filled out forms of the selected folder or room.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FormSubmittedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFormFilledOut(z, bundle) {
  const folderId = bundle.inputData.folderId || bundle.inputData.id
  if (!folderId) {
    return []
  }
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    filterType: "FilesOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const forms = await files.listFiles(Number(folderId), filters)
  const { formId } = bundle.inputData
  return forms.files
    .filter((form) => form.formFillingStatus === COMPLETE_FORM_STATUS)
    .filter((form) => !formId || String(form.id) === String(formId))
    .slice(0, 100)
    .map(normalizeFile)
}

const formFilledOut = createWebhookTrigger(
  "formFilledOut",
  "Form Filled Out",
  "Triggers when all roles have filled out a form in a virtual data room.",
  [FORM_FILLED_OUT],
  {
    filters: { entryField: "formId" },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        altersDynamicFields: true,
        dynamic: "foldersList.id.title",
        helpText: "A folder with forms. Leave empty to watch only the forms at the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        helpText: "Leave empty to watch all forms of the room or folder.",
        key: "formId",
        label: "Form",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "Form",
    performList: performFormFilledOut,
    sample: samples.file
  }
)

const foldersList = {
  display: {
    description: "Hidden trigger to get a list of folders from a folder or room.",
    hidden: true,
    label: "List of Folders"
  },
  key: "foldersList",
  noun: "Folder",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      // The dropdown is empty until a room or folder is selected.
      if (!bundle.inputData.id && !bundle.inputData.folderId) {
        return []
      }
      return performFolderCreated(z, bundle)
    },
    sample: samples.folder
  }
}

/**
 * @param {string[]} names
 * @returns {{id: string, name: string}[]}
 */
function tagChoices(names) {
  return names.map((name) => ({ id: name, name }))
}

const tagsList = {
  display: {
    description: "Hidden trigger to get a list of tags.",
    hidden: true,
    label: "List of Tags"
  },
  key: "tagsList",
  noun: "Tag",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<{id: string, name: string}[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const names = await files.listTags(pageFilters(bundle))
      return tagChoices(names)
    },
    sample: samples.tag
  }
}

const roomTagsList = {
  display: {
    description: "Hidden trigger to get a list of tags of a room.",
    hidden: true,
    label: "List of Room Tags"
  },
  key: "roomTagsList",
  noun: "Tag",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, {id?: string}>} bundle
     * @returns {Promise<{id: string, name: string}[]>}
     */
    async perform(z, bundle) {
      // The dropdown is empty until a room is selected.
      if (!bundle.inputData.id) {
        return []
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.roomInfo(normalizeId(bundle.inputData.id))
      return tagChoices(room.tags || [])
    },
    sample: samples.tag
  }
}

const destinationFoldersList = {
  display: {
    description: "Hidden trigger to get a list of folders of the destination room.",
    hidden: true,
    label: "List of Destination Folders"
  },
  key: "destinationFoldersList",
  noun: "Folder",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, {destinationRoomId?: string}>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      // The dropdown is empty until a destination room is selected.
      if (!bundle.inputData.destinationRoomId) {
        return []
      }
      const inputData = { id: normalizeId(bundle.inputData.destinationRoomId) }
      return performFolderCreated(z, { ...bundle, inputData })
    },
    sample: samples.folder
  }
}

const foldersInMyDocumentsList = {
  display: {
    description: "Hidden trigger to get a list of folders from the Files section.",
    hidden: true,
    label: "List of Folders from Files Section"
  },
  key: "foldersInMyDocumentsList",
  noun: "Folder",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const folderId = await files.myDocumentsSection()
      const refinedBundle = {
        ...bundle,
        inputData: {
          ...bundle.inputData,
          id: folderId.pathParts[0].id
        }
      }
      return await performFolderCreated(z, refinedBundle)
    },
    sample: samples.folder
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<RoomData[]>}
 */
async function performRoomCreated(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  // Without sorting, DocSpace uses the order from its interface, so new rooms
  // can be missing from the first page.
  const filters = {
    ...pageFilters(bundle),
    sortBy: "DateAndTimeCreation",
    sortOrder: "descending"
  }
  const rooms = await files.listRooms(filters)
  // Form filling rooms are in the separate Forms section and aren't returned
  // by default.
  const forms = await files.listRooms({
    ...filters,
    searchArea: "Forms"
  })
  const ids = new Set(rooms.folders.map((room) => String(room.id)))
  const list = rooms.folders
    .concat(forms.folders.filter((room) => !ids.has(String(room.id))))
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
  list.forEach((room) => {
    room.id = normalizeId(room.id)
  })
  // Return both lists in full, so that no room is lost between pages.
  return list
}

// Only Full admins and Room admins can subscribe to the `room.created` event,
// so this trigger uses polling.
const roomCreated = {
  display: {
    description: "Triggers when a room is created.",
    label: "Room Created"
  },
  key: "roomCreated",
  noun: "Room",
  operation: {
    canPaginate: true,
    perform: performRoomCreated,
    sample: samples.room
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<RoomData[]>}
 */
async function performRoomArchived(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    searchArea: "Archive",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const rooms = await files.listRooms(filters)
  rooms.folders.forEach((room) => {
    room.id = normalizeId(room.id)
  })
  return rooms.folders
}

const roomTemplatesList = {
  display: {
    description: "Hidden trigger to get a list of room templates.",
    hidden: true,
    label: "List of Room Templates"
  },
  key: "roomTemplatesList",
  noun: "Template",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const templates = await files.listRooms({ ...pageFilters(bundle), searchArea: "Templates" })
      templates.folders.forEach((template) => {
        template.id = normalizeId(template.id)
      })
      return templates.folders
    },
    sample: samples.room
  }
}

const archivedRoomsList = {
  display: {
    description: "Hidden trigger to get a list of archived rooms.",
    hidden: true,
    label: "List of Archived Rooms"
  },
  key: "archivedRoomsList",
  noun: "Room",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        ...pageFilters(bundle),
        searchArea: "Archive"
      }
      const rooms = await files.listRooms(filters)
      rooms.folders.forEach((room) => {
        room.id = normalizeId(room.id)
      })
      return rooms.folders
    },
    sample: samples.room
  }
}

const roomArchived = createWebhookTrigger(
  "roomArchived",
  "Room Archived",
  "Triggers when a room is archived.",
  [ROOM_ARCHIVED],
  {
    noun: "Room",
    performList: performRoomArchived,
    sample: samples.room
  }
)

/**
 * @typedef {Object} RoomUpdatedFields
 * @property {string=} roomId
 */

/**
 * Returns the selected room, or the rooms of the workspace if no room is
 * selected. Recently changed rooms go first.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, RoomUpdatedFields>} bundle
 * @returns {Promise<RoomData[]>}
 */
async function performRoomUpdated(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  /** @type {RoomData[]} */
  let rooms
  if (bundle.inputData.roomId) {
    rooms = [await files.roomInfo(Number(bundle.inputData.roomId))]
  } else {
    const filters = {
      ...pageFilters(bundle),
      sortBy: "DateAndTime",
      sortOrder: "descending"
    }
    rooms = (await files.listRooms(filters)).folders
  }
  rooms.forEach((room) => {
    room.id = normalizeId(room.id)
  })
  return rooms
}

const roomUpdated = createWebhookTrigger(
  "roomUpdated",
  "Room Updated",
  "Triggers when a room is changed, for example renamed or its logo, tags or settings are changed.",
  [ROOM_UPDATED],
  {
    filters: { entryField: "roomId" },
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch all rooms.",
        key: "roomId",
        label: "Room",
        type: "string"
      }
    ],
    noun: "Room",
    performList: performRoomUpdated,
    sample: samples.room
  }
)

/**
 * Collaboration rooms, virtual data rooms and AI rooms don't have external
 * links.
 * @param {number} roomType
 * @returns {boolean}
 */
function supportsExternalLinks(roomType) {
  return !isCollaborationRoom(roomType) && !isVirtualDataRoom(roomType) && !isAiRoom(roomType)
}

const roomsFiltered = {
  display: {
    description: "Hidden trigger to get a list of rooms that support external links.",
    hidden: true,
    label: "Rooms With External Links"
  },
  key: "roomsFiltered",
  noun: "Room",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const rooms = await performRoomCreated(z, bundle)
      return rooms.filter((room) => supportsExternalLinks(Number(room.roomType)))
    },
    sample: samples.room
  }
}

const shareRoles = {
  display: {
    description: "Hidden trigger to get the roles available in a room.",
    hidden: true,
    label: "Room Roles"
  },
  key: "shareRoles",
  noun: "Role",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ShareRolesFields>} bundle
     * @returns {Promise<RoleData[]>}
     */
    async perform(z, bundle) {
      /**
       * @type {RoleData[]}
       */
      var roles = []
      const client = new Client(bundle.authData.baseUrl, z.request)
      // checking user rights
      const people = new PeopleService(client)
      const user = await people.self()
      if (!user?.isAdmin && !user?.isRoomAdmin && !user?.isOwner) {
        // user not have permission to invite a user to the room
        return roles
      }
      const files = new FilesService(client)
      const room = await files.roomInfo(bundle.inputData.roomId)
      const roomType = Number(room.roomType)
      if (bundle.inputData.userId) {
        const foundUser = await people.user(bundle.inputData.userId)
        // Room manager is a paid role. Only the owner, Full admins and Room
        // admins can have it.
        if (foundUser?.isOwner || foundUser?.isAdmin || foundUser?.isRoomAdmin) {
          roles.push({ id: ROOM_MANAGER, name: "Room manager" })
        }
      }
      if (isPublicRoom(roomType)) {
        roles = roles.concat(publicRoomRoles())
      }
      if (isCustomRoom(roomType)) {
        roles = roles.concat(customRoomRoles())
      }
      if (isFillingFormsRoom(roomType)) {
        roles = roles.concat(fillingFormsRoomRoles())
      }
      if (isCollaborationRoom(roomType)) {
        roles = roles.concat(collaborationRoomRoles())
      }
      if (isVirtualDataRoom(roomType)) {
        roles = roles.concat(virtualDataRoomRoles())
      }
      if (isAiRoom(roomType)) {
        roles = roles.concat(aiRoomRoles())
      }
      roles.forEach((role) => {
        role.id = Number(role.id)
      })
      return roles
    },
    sample: samples.role
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, UserInvitedFields>} bundle
 * @returns {Promise<User[]>}
 */
async function performUserInvited(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const members = await files.listUsers(bundle.inputData.id, pageFilters(bundle))
  // The list has users and groups. Only users have `sharedToUser`.
  /** @type {User[]} */
  let users = []
  members.forEach((item) => {
    if (item.sharedToUser && item.sharedToUser.id !== REMOVED_USER_ID) {
      users.push(item.sharedToUser)
    }
  })
  // Boolean fields may come from Zapier as strings.
  if (String(bundle.inputData.active) === "true") {
    users = users.filter((item) => item.activationStatus === ACTIVATION_STATUS)
  }
  return users
}

// DocSpace has no webhook event for adding a user to a room. The
// `user.invited` event is about invitations to the workspace, so this trigger
// uses polling.
const userInvited = {
  display: {
    description: "Triggers when a user is added to a room.",
    label: "New Room Member"
  },
  key: "userInvited",
  noun: "User",
  operation: {
    canPaginate: true,
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        type: "string"
      },
      {
        helpText: "Skip members who haven't accepted the invitation yet.",
        key: "active",
        label: "Only active members",
        type: "boolean"
      }
    ],
    perform: performUserInvited,
    sample: samples.share
  }
}

module.exports = {
  archivedRoomsList,
  destinationFoldersList,
  fileCreated,
  fileCreatedInMyDocuments,
  fileDeleted,
  fileDeletedInMyDocuments,
  fileMoved,
  fileUpdated,
  filesList,
  filesListFromMyDocuments,
  filteredSections,
  folderCreated,
  folderCreatedInMyDocuments,
  folderDeleted,
  folderDeletedInMyDocuments,
  folderMoved,
  folderUpdated,
  foldersInMyDocumentsList,
  foldersList,
  formFilledOut,
  formSubmitted,
  roomArchived,
  roomCreated,
  roomTagsList,
  roomTemplatesList,
  roomUpdated,
  roomsFiltered,
  shareRoles,
  tagsList,
  userInvited
}
