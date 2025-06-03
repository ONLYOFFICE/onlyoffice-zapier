# ONLYOFFICE integration for Zapier

This integration allows users to create their own DocSpace integration and configure actions of the *"If X happens, then you need to do Y"* format without any programming. These interactions are called *Zaps*.

## Installing ONLYOFFICE integration for Zapier

1. Register for a [Zapier account](https://zapier.com/sign-up) or [log in](https://zapier.com/app/login).
2. In the top menu, go to **My Apps**.
3. Click **Connect a new account...** and find ONLYOFFICE DocSpace.
4. Enter [URL](https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/basic-authentication/) to your DocSpace, email and password to connect your account.
5. Start automating by selecting an existing Zap or creating a new one with the Zap Editor, which will guide you through each step.

For examples and ideas, explore available ONLYOFFICE integration with Zapier.


## Features

### Authentication

The Zapier app implements session authentication. To log in, the user must enter the DocSpace URL, username and password.

### Triggers

At the moment, the following triggers are implemented in DocSpace:

| Trigger | Fields |
| ------------- | ------------- |
| File Created | Room id, Folder id |
| File Created in My Documents | Folder id |
| File Deleted | Room id, Folder id |
| File Deleted from My Documents | Folder id |
| Folder Created | Room id, Folder id |
| Folder Created in My Documents | Folder id |
| Folder Deleted | Room id, Folder id |
| Folder Deleted from My Documents | Folder id |
| Room Archived | - |
| Room Created | - |
| User Joined | Room id, active |
| User Added | - |

In the free version, the trigger is called every 10 minutes. When a trigger is activated, it makes a request to DocSpace, for example to get a list of rooms. The response from Zapier returns an array of all rooms with the *id* field.

Zapier compares this array with the previous result. If there are new elements in the array, Zap is called for each new element and performs a chain of actions.

For example, if 3 new rooms appear in 10 minutes, a Zap will be called for each new room, and the corresponding chain of actions will be performed for it.

### Actions

At the moment, the following actions are available in DocSpace:

| Actions | API method | Fields |
| ------------- | ------------- | ------------- |
| Archive Room | [PUT api/2.0/files/rooms/{id}/archive](https://api.onlyoffice.com/docspace/api-backend/usage-api/archive-room/) | Room id |
| Create File | [POST api/2.0/files/{folderId}/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file/) | Room id, Folder id, Title |
| Create File in My Documents | [POST api/2.0/files/@my/file](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file-my-documents/) | Folder id, Title |
| Create Folder | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder/) | Room id, Folder id, Title |
| Create Folder in My Documents | [POST api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder/) | Folder id, Title |
| Delete Folder | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder/) | Room id, Folder id |
| Delete Folder from My Documents | [DELETE api/2.0/files/folder/{folderId}](https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder/) | Folder id |
| Download File | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-presigned-file-uri/) | Room id, Folder id, File id |
| Download File from My Documents | [GET api/2.0/files/file/{fileId}/presigned](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-presigned-file-uri/) | Folder id, File id |
| Get External Link | [GET api/2.0/files/rooms/{id}/link](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-file-primary-external-link/) | Room id |
| Create Room | [POST api/2.0/files/rooms](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/) | Title, Type |
| Share Room | [GET api/2.0/files/rooms/{id}/share](https://api.onlyoffice.com/docspace/api-backend/usage-api/get-room-security-info/) | Room id, User id, Role |
| Upload File | [POST api/2.0/files/{folderId}/upload/create_session](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-upload-session/) | Room id, Folder id, URL or File |
| Upload File to My Documents | [POST api/2.0/files/{folderId}/upload/create_session](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-upload-session/) | Folder id, URL or File |
| Invite User | [POST api/2.0/people/invite](https://api.onlyoffice.com/docspace/api-backend/usage-api/invite-users/) | Email, Role |

When creating a new Zap, we set up a chain of actions that follows the trigger. Zapier automatically performs these actions on new data when the trigger fires. You can manually start the Zap by clicking the **Run Zap** button.

### Search

Search is used to return the most suitable value for the request.

At the moment, search for folders and files by name is available through the sections or rooms.

**Search through a section**

1. Open the *Section* tab.
2. Choose a section for search (My Documents, Rooms, Archive, Trash).
3. Specify the file/folder name.

**Search through a room**

1. Open the *Custom* tab.
2. Specify the room ID from the trigger.


## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md).
