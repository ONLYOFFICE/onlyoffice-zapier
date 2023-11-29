//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/** @type {RoomData} */
const room = {
  id: 1,
  title: "My Room"
}

/** @type {FileData} */
const file = {
  folderId: 1
}

/** @type {FolderData} */
const folder = {
  parentId: 1,
  id: 2,
  title: "Test Folder",
  created: "2023-01-01T13:00:00.0000000+03:00",
  createdBy: {
    id: "11111111-2222-3333-4444-555555555555",
    displayName: "John Doe"
  },
  updated: "2023-01-01T13:00:00.0000000+03:00",
  rootFolderType: 14,
  updatedBy: {
    id: "11111111-2222-3333-4444-555555555555",
    displayName: "John Doe"
  }
}

/** @type {ProgressData} */
const progress = {
  id: "00000000-1111-2222-3333-444444444444",
  operation: 0,
  progress: 0,
  error: "",
  processed: "0",
  finished: false
}

module.exports = { room, file, folder, progress }
