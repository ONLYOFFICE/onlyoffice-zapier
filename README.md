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
| File Created | Room, Folder |
| File Created in Files Section | Folder |
| File Deleted | Room, Folder |
| File Deleted from Files Section | Folder |
| File Moved | Room, Folder |
| File Updated | Room, Folder |
| Folder Created | Room, Folder |
| Folder Created in Files Section | Folder |
| Folder Deleted | Room, Folder |
| Folder Deleted from Files Section | Folder |
| Folder Moved | Room, Folder |
| Folder Updated | Room, Folder |
| Form Filled Out | Room, Folder, Form |
| Form Submitted | Room, Folder, Form |
| Room Archived | - |
| Room Created | - |
| Room Updated | Room |
| New Room Member | Room, Only active members |
| User Added | - |

In the free version, the trigger is called every 10 minutes. When a trigger is activated, it makes a request to the workspace, for example to get a list of rooms. The response from Zapier returns an array of all rooms with the *id* field.

Zapier compares this array with the previous result. If there are new elements in the array, Zap is called for each new element and performs a chain of actions.

For example, if 3 new rooms appear in 10 minutes, a Zap will be called for each new room, and the corresponding chain of actions will be performed for it.

### Actions

At the moment, the following actions are available for ONLYOFFICE Apps:

| Actions | API method | Fields |
| ------------- | ------------- | ------------- |
| Unarchive Room | [PUT api/2.0/files/rooms/{id}/unarchive](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/unarchive-room) | Room |
| Archive Room | [PUT api/2.0/files/rooms/{id}/archive](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/archive-room) | Room |
| Create File | [POST api/2.0/files/{folderId}/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-file) | Room, Folder, Title |
| Create File with Content | [POST api/2.0/files/{folderId}/text](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-text-file), [POST api/2.0/files/{folderId}/html](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-html-file) | Room, Folder, Title, Format, Content |
| Create File in Files Section | [POST api/2.0/files/@my/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/create-file-in-my-documents) | Folder, Title |
| Create Folder | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/create-folder) | Room, Folder, Title |
| Create Folder in Files Section | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/create-folder) | Folder, Title |
| Delete Folder | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/delete-folder) | Room, Folder |
| Delete Folder from Files Section | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/delete-folder) | Folder, Delete permanently |
| Download File | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-presigned-file-uri) | Room, Folder, File |
| Download File from Files Section | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-presigned-file-uri) | Folder, File |
| Lock File | [PUT api/2.0/files/file/{fileId}/lock](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/lock-file) | Room, Folder, File |
| Unlock File | [PUT api/2.0/files/file/{fileId}/lock](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/lock-file) | Room, Folder, File |
| Get File External Link | [GET api/2.0/files/file/{fileId}/links](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-file-links), [GET api/2.0/files/file/{fileId}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-file-primary-external-link) | Room, Folder, File, Create the link if there is none |
| Get Folder External Link | [GET api/2.0/files/folder/{folderId}/links](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder-links), [GET api/2.0/files/folder/{folderId}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder-primary-external-link) | Room, Folder, Create the link if there is none |
| Get Room External Link | [GET api/2.0/files/rooms/{id}/links](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-room-links), [GET api/2.0/files/rooms/{id}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-rooms-primary-external-link) | Room, Create the link if there is none |
| Create Room | [POST api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/create-room) | Title, Room type, Tags |
| Create Room from Template | [POST api/2.0/files/rooms/fromtemplate](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/create-room-from-template) | Template, Title |
| Add User to Room | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room, User, Role, Notify, Message |
| Upload File | [POST api/2.0/files/{folderId}/session](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/create-upload-session-in-folder) | Room, Folder, File |
| Upload File to Files Section | [POST api/2.0/files/{folderId}/session](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/create-upload-session-in-folder) | Folder, File |
| Invite Guest | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room, Email, Role, Notify, Message |
| Remove User from Room | [PUT api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/set-room-security) | Room, User |
| Get Room Members | [GET api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-room-security-info) | Room |
| Add Room Tags | [PUT api/2.0/files/rooms/{id}/tags](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/add-room-tags) | Room, Tags |
| Remove Room Tags | [DELETE api/2.0/files/rooms/{id}/tags](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/delete-room-tags) | Room, Tags |
| Invite User | [POST api/2.0/people/invite](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/profiles/invite-users) | Email, User type |
| Change User Type | [PUT api/2.0/people/type/{type}](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/user-type/update-user-type), [POST api/2.0/people/type](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/user-type/start-user-type-update) | User, User type |
| Disable User | [PUT api/2.0/people/status/{status}](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/user-status/update-user-status) | User |
| Enable User | [PUT api/2.0/people/status/{status}](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/user-status/update-user-status) | User |
| Get File | [GET api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-file-info) | Room, Folder, File |
| List Folder Contents | [GET api/2.0/files/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder) | Room, Folder, Limit |
| Get Room | [GET api/2.0/files/rooms/{id}](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-room-info) | Room |
| Delete File | [DELETE api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/delete-file) | Room, Folder, File, Delete permanently |
| Rename File | [PUT api/2.0/files/file/{fileId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/update-file) | Room, Folder, File, New title |
| Convert File | [POST api/2.0/files/file/{fileId}/copyas](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/copy-file-as) | Room, Folder, File, Format, New title |
| Generate Form Report | [POST api/2.0/files/file/{fileId}/xlsx](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/generate-xlsx), [GET api/2.0/files/file/{fileId}/xlsx](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/files/get-xlsx) | Room, Folder, Form |
| Rename Folder | [PUT api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/rename-folder) | Room, Folder, New title |
| Move File, Move Folder | [PUT api/2.0/files/fileops/move](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/move-batch-items) | Room, Folder, File, Destination room, Destination folder, If the name is taken |
| Copy File, Copy Folder | [PUT api/2.0/files/fileops/copy](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/operations/copy-batch-items) | Room, Folder, File, Destination room, Destination folder, If the name is taken |

When creating a new Zap, we set up a chain of actions that follows the trigger. Zapier automatically performs these actions on new data when the trigger fires. You can manually start the Zap by clicking the **Run Zap** button.

### Search

A search returns the entries that match the request. The next steps of the Zap use the first of them.

| Search | API method | Fields |
| ------------- | ------------- | ------------- |
| Find File | [GET api/2.0/files/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder) | Section, Title |
| Find Folder | [GET api/2.0/files/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/files/folders/get-folder) | Section, Title |
| Find Room | [GET api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/rooms/get-rooms-folder) | Title |
| Find User | [GET api/2.0/people/email](https://api.onlyoffice.com/docspace/api-backend/usage-api/people/profiles/get-profile-by-email) | Email |

Find File and Find Folder search by title in the selected section, including its subfolders. In actions, the Room and User fields can use Find Room and Find User.


## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md).
