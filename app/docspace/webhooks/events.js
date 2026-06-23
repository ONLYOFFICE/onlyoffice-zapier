/* eslint-disable sort-keys */
//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

// DocSpace WebhookTrigger enum bitmask values.
// See: ASC.Webhooks.Core/WebhookTrigger.cs

// User events
const USER_ADDED = 1
const USER_INVITED = 2
const USER_UPDATED = 4
const USER_DELETED = 8

// Group events
const GROUP_CREATED = 16
const GROUP_UPDATED = 32
const GROUP_DELETED = 64

// File events
const FILE_CREATED = 128
const FILE_UPLOADED = 256
const FILE_UPDATED = 512
const FILE_DELETED = 1024
const FILE_PERMANENTLY_DELETED = 2048
const FILE_RESTORED = 4096
const FILE_COPIED = 8192
const FILE_MOVED = 16384

// Folder events
const FOLDER_CREATED = 32768
const FOLDER_UPDATED = 65536
const FOLDER_DELETED = 131072
const FOLDER_PERMANENTLY_DELETED = 262144
const FOLDER_RESTORED = 524288
const FOLDER_COPIED = 1048576
const FOLDER_MOVED = 2097152

// Room events
const ROOM_CREATED = 4194304
const ROOM_UPDATED = 8388608
const ROOM_ARCHIVED = 16777216
const ROOM_DELETED = 33554432
const ROOM_RESTORED = 67108864
const ROOM_COPIED = 134217728

// Maps event IDs to DocSpace trigger name strings.
/** @type {Record<number, string>} */
const WEBHOOK_TRIGGER_NAMES = {
  [USER_ADDED]: "user.created",
  [USER_INVITED]: "user.invited",
  [USER_UPDATED]: "user.updated",
  [USER_DELETED]: "user.deleted",
  [GROUP_CREATED]: "group.created",
  [GROUP_UPDATED]: "group.updated",
  [GROUP_DELETED]: "group.deleted",
  [FILE_CREATED]: "file.created",
  [FILE_UPLOADED]: "file.uploaded",
  [FILE_UPDATED]: "file.updated",
  [FILE_DELETED]: "file.trashed",
  [FILE_PERMANENTLY_DELETED]: "file.deleted",
  [FILE_RESTORED]: "file.restored",
  [FILE_COPIED]: "file.copied",
  [FILE_MOVED]: "file.moved",
  [FOLDER_CREATED]: "folder.created",
  [FOLDER_UPDATED]: "folder.updated",
  [FOLDER_DELETED]: "folder.trashed",
  [FOLDER_PERMANENTLY_DELETED]: "folder.deleted",
  [FOLDER_RESTORED]: "folder.restored",
  [FOLDER_COPIED]: "folder.copied",
  [FOLDER_MOVED]: "folder.moved",
  [ROOM_CREATED]: "room.created",
  [ROOM_UPDATED]: "room.updated",
  [ROOM_ARCHIVED]: "room.archived",
  [ROOM_DELETED]: "room.deleted",
  [ROOM_RESTORED]: "room.restored",
  [ROOM_COPIED]: "room.copied"
}

// Alias: triggers.js imports ROOM_USER_ADDED
const ROOM_USER_ADDED = USER_INVITED

module.exports = {
  FILE_COPIED,
  FILE_CREATED,
  FILE_DELETED,
  FILE_MOVED,
  FILE_PERMANENTLY_DELETED,
  FILE_RESTORED,
  FILE_UPDATED,
  FILE_UPLOADED,
  FOLDER_COPIED,
  FOLDER_CREATED,
  FOLDER_DELETED,
  FOLDER_MOVED,
  FOLDER_PERMANENTLY_DELETED,
  FOLDER_RESTORED,
  FOLDER_UPDATED,
  GROUP_CREATED,
  GROUP_DELETED,
  GROUP_UPDATED,
  ROOM_ARCHIVED,
  ROOM_COPIED,
  ROOM_CREATED,
  ROOM_DELETED,
  ROOM_RESTORED,
  ROOM_UPDATED,
  ROOM_USER_ADDED,
  USER_ADDED,
  USER_DELETED,
  USER_INVITED,
  USER_UPDATED,
  WEBHOOK_TRIGGER_NAMES
}
