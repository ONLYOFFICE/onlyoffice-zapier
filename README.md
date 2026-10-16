# ONLYOFFICE integration for Zapier

This integration connects ONLYOFFICE Apps to Zapier. It lets you automate work with rooms, files, folders and users in the *"If X happens, then do Y"* format without any programming. These automations are called *Zaps*.

The integration supports ONLYOFFICE Apps (formerly ONLYOFFICE DocSpace) 4.0 and later.

## Installing ONLYOFFICE integration for Zapier

1. Register for a [Zapier account](https://zapier.com/sign-up) or [log in](https://zapier.com/app/login).
2. In Zapier, open **App connections** and add a new connection.
3. Find **ONLYOFFICE DocSpace**.
4. Enter the address of your workspace (for example, `https://yourname.onlyoffice.com`), your email and password to connect your account.
5. Start automating by selecting an existing Zap or creating a new one with the Zap Editor, which will guide you through each step.

## Features

### Authentication

The integration signs in to the workspace with your email and password. Sign-in with two-factor authentication or SSO isn't supported.

### Triggers

| Trigger | Fields |
| ------------- | ------------- |
| File Created | Room, Folder |
| File Created in Files Section | Folder |
| File Deleted | Room, Folder |
| File Deleted from Files Section | Folder |
| Folder Created | Room, Folder |
| Folder Created in Files Section | Folder |
| Folder Deleted | Room, Folder |
| Folder Deleted from Files Section | Folder |
| Room Archived | - |
| Room Created | - |
| New Room Member | Room, Only active members |
| User Added | - |

The file, folder and *Room Archived* triggers are instant. When you turn on a Zap, the integration creates a webhook in your workspace, and the workspace sends events to Zapier right away. When you turn off the Zap, the webhook is removed. *File Deleted* and *Folder Deleted* triggers fire when an item is moved to Trash.

*Room Created*, *New Room Member* and *User Added* triggers check the workspace for new items regularly. How often depends on your Zapier plan. If several new items appear between two checks, the Zap runs for each of them.

### Actions

| Action | API method | Fields |
| ------------- | ------------- | ------------- |
| Archive Room | [PUT api/2.0/files/rooms/{id}/archive](https://api.onlyoffice.com/docspace/api-backend/usage-api/archive-room) | Room |
| Create File | [POST api/2.0/files/{folderId}/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file) | Room, Folder, Title |
| Create File in Files Section | [POST api/2.0/files/@my/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file-in-my-documents) | Folder, Title |
| Create Folder | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder) | Room, Folder, Title |
| Create Folder in Files Section | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder) | Folder, Title |
| Create Room | [POST api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room) | Title, Room type |
| Delete Folder | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder) | Room, Folder |
| Delete Folder from Files Section | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder) | Folder |
| Download File | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-presigned-file-uri) | Room, Folder, File |
| Download File from Files Section | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-presigned-file-uri) | Folder, File |
| Get External Link | [GET api/2.0/files/rooms/{id}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-rooms-primary-external-link) | Room |
| Invite Guest | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/set-room-security) | Room, Email, Role |
| Invite User | [POST api/2.0/people/invite](https://api.onlyoffice.com/docspace/api-backend/usage-api/invite-users) | Email, User type |
| Share Room | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/set-room-security) | Room, User, Role |
| Upload File | POST api/2.0/files/{folderId}/session | Room, Folder, File |
| Upload File to Files Section | POST api/2.0/files/{folderId}/session | Folder, File |

When creating a new Zap, you set up a chain of actions that follows the trigger. Zapier automatically performs these actions on new data when the trigger fires.

Notes:

- *Delete Folder* moves the folder to Trash.
- *Get External Link* creates the primary external link if the room doesn't have one. Collaboration rooms, Virtual Data Rooms and AI Rooms don't have external links.
- *Invite Guest* requires guest invitations to be allowed in the workspace.

### Searches

| Search | Fields |
| ------------- | ------------- |
| Find File | Section, Title |
| Find Folder | Section, Title |

A search finds files or folders whose title contains the specified text. It looks in the selected section (for example, Files, Rooms or Archive) and its subfolders.

## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md).
