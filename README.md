# ONLYOFFICE integration for Zapier

This integration allows users to create their own ONLYOFFICE Apps integration and configure actions of the *"If X happens, then you need to do Y"* format without any programming. These interactions are called *Zaps*.

## Installing ONLYOFFICE integration for Zapier

1. Register for a [Zapier account](https://zapier.com/sign-up) or [log in](https://zapier.com/app/login).
2. In the top menu, go to **My Apps**.
3. Click **Connect a new account...** and find ONLYOFFICE Apps.
4. Enter [URL](https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/basic-authentication/) of your workspace, email and password to connect your account.
5. Start automating by selecting an existing Zap or creating a new one with the Zap Editor, which will guide you through each step.

For examples and ideas, explore available ONLYOFFICE integration with Zapier.


## Features

### Authentication

The Zapier app implements session authentication. To log in, the user must enter the workspace URL, username and password.

### Triggers

At the moment, the following triggers are available for ONLYOFFICE Apps:

| Trigger | Fields |
| ------------- | ------------- |
| File Created | Room id, Folder id |
| File Created in Files Section | Folder id |
| File Deleted | Room id, Folder id |
| File Deleted from Files Section | Folder id |
| File Moved | Room id, Folder id |
| File Updated | Room id, Folder id |
| Folder Created | Room id, Folder id |
| Folder Created in Files Section | Folder id |
| Folder Deleted | Room id, Folder id |
| Folder Deleted from Files Section | Folder id |
| Folder Moved | Room id, Folder id |
| Folder Updated | Room id, Folder id |
| Form Filled Out | Room id, Folder id, Form id |
| Form Submitted | Room id, Folder id, Form id |
| Room Archived | - |
| Room Created | - |
| Room Updated | Room id |
| User Joined | Room id, active |
| User Added | - |

In the free version, the trigger is called every 10 minutes. When a trigger is activated, it makes a request to the workspace, for example to get a list of rooms. The response from Zapier returns an array of all rooms with the *id* field.

Zapier compares this array with the previous result. If there are new elements in the array, Zap is called for each new element and performs a chain of actions.

For example, if 3 new rooms appear in 10 minutes, a Zap will be called for each new room, and the corresponding chain of actions will be performed for it.

### Actions

At the moment, the following actions are available for ONLYOFFICE Apps:

| Actions | API method | Fields |
| ------------- | ------------- | ------------- |
| Unarchive Room | [PUT api/2.0/files/rooms/{id}/unarchive](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/unarchive-room) | Room id |
| Archive Room | [PUT api/2.0/files/rooms/{id}/archive](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/archive-room) | Room id |
| Create File | [POST api/2.0/files/{folderId}/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-file) | Room id, Folder id, Title |
| Create File with Content | [POST api/2.0/files/{folderId}/text](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-text-file), [POST api/2.0/files/{folderId}/html](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-html-file) | Room id, Folder id, Title, Format, Content |
| Create File in Files Section | [POST api/2.0/files/@my/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-file-in-my-documents) | Folder id, Title |
| Create Folder | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/create-folder) | Room id, Folder id, Title |
| Create Folder in Files Section | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/create-folder) | Folder id, Title |
| Delete Folder | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/delete-folder) | Room id, Folder id |
| Delete Folder from Files Section | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/delete-folder) | Folder id |
| Download File | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-presigned-file-uri) | Room id, Folder id, File id |
| Download File from Files Section | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-presigned-file-uri) | Folder id, File id |
| Lock File | [PUT api/2.0/files/file/{fileId}/lock](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/lock-file) | Room id, Folder id, File id |
| Unlock File | [PUT api/2.0/files/file/{fileId}/lock](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/lock-file) | Room id, Folder id, File id |
| Get File External Link | [GET api/2.0/files/file/{fileId}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-file-primary-external-link) | Room id, Folder id, File id |
| Get External Link | [GET api/2.0/files/rooms/{id}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-rooms-primary-external-link) | Room id |
| Create Room | [POST api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/create-room) | Title, Type |
| Share Room | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room id, User id, Role |
| Upload File | [POST api/2.0/files/{folderId}/session](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/create-upload-session-in-folder) | Room id, Folder id, URL or File |
| Upload File to Files Section | [POST api/2.0/files/{folderId}/session](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/create-upload-session-in-folder) | Folder id, URL or File |
| Invite Guest | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room id, Email, Role |
| Remove User from Room | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room id, User id |
| Get Room Members | [GET api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-room-security-info) | Room id |
| Add Room Tags | [PUT api/2.0/files/rooms/{id}/tags](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/add-room-tags) | Room id, Tags |
| Remove Room Tags | [DELETE api/2.0/files/rooms/{id}/tags](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/delete-room-tags) | Room id, Tags |
| Invite User | [POST api/2.0/people/invite](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/profiles/invite-users) | Email, Role |
| Get File | [GET api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-file-info) | Room id, Folder id, File id |
| List Folder Contents | [GET api/2.0/files/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder) | Room id, Folder id, Limit |
| Get Room | [GET api/2.0/files/rooms/{id}](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-room-info) | Room id |
| Delete File | [DELETE api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/delete-file) | Room id, Folder id, File id, Delete permanently |
| Rename File | [PUT api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/update-file) | Room id, Folder id, File id, New title |
| Convert File | [POST api/2.0/files/file/{fileId}/copyas](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/copy-file-as) | Room id, Folder id, File id, Format, New title |
| Rename Folder | [PUT api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/rename-folder) | Room id, Folder id, New title |
| Move File, Move Folder | [PUT api/2.0/files/fileops/move](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/move-batch-items) | Room id, Folder id, File id, Destination room, Destination folder, If the name is taken |
| Copy File, Copy Folder | [PUT api/2.0/files/fileops/copy](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/copy-batch-items) | Room id, Folder id, File id, Destination room, Destination folder, If the name is taken |

When creating a new Zap, we set up a chain of actions that follows the trigger. Zapier automatically performs these actions on new data when the trigger fires. You can manually start the Zap by clicking the **Run Zap** button.

### Search

Search is used to return the most suitable value for the request.

At the moment, search for folders and files by name is available through the sections or rooms.

**Search through a section**

1. Open the *Section* tab.
2. Choose a section for search (Files, Rooms, Archive, Trash).
3. Specify the file/folder name.

**Search through a room**

1. Open the *Custom* tab.
2. Specify the room ID from the trigger.

| Search | API method | Fields |
| ------------- | ------------- | ------------- |
| Find Room | [GET api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-rooms-folder) | Title |
| Find User | [GET api/2.0/people/email](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/profiles/get-profile-by-email) | Email |


## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md).
