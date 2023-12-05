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

/** @type {UploadResult} */
const uploadResult = {
  id: 2,
  folderId: 1,
  version: 1,
  title: "File from Zapier.docx",
  file: {
    folderId: 1,
    viewUrl: "https://example.onlyoffice.io/filehandler.ashx?action=download&fileid=2",
    webUrl: "https://example.onlyoffice.io/doceditor?fileid=2&version=1",
    fileType: 7,
    fileExst: ".docx",
    id: 2,
    title: "File from Zapier.docx",
    created: "2023-01-01T12:00:00.0000000+03:00",
    createdBy: {
      id: "00000000-1111-2222-3333-444444444444",
      displayName: "John Doe"
    },
    updated: "2023-01-01T12:00:00.0000000+03:00",
    rootFolderType: 5,
    updatedBy: {
      id: "00000000-1111-2222-3333-444444444444",
      displayName: "John Doe"
    }
  }
}

module.exports = { room, file, uploadResult }
