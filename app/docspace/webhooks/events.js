//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// DocSpace WebhookTrigger enum bitmask values.
// See: ASC.Webhooks.Core/WebhookTrigger.cs

const FILE_CREATED = 128
const FILE_UPLOADED = 256
// The `file.trashed` event.
const FILE_DELETED = 1024
const FOLDER_CREATED = 32768
// The `folder.trashed` event.
const FOLDER_DELETED = 131072
const ROOM_ARCHIVED = 16777216

module.exports = {
  FILE_CREATED,
  FILE_DELETED,
  FILE_UPLOADED,
  FOLDER_CREATED,
  FOLDER_DELETED,
  ROOM_ARCHIVED
}
