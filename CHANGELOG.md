## 1.1.2
- add webhooks
- new File Updated trigger
- new File Moved trigger
- new Folder Updated trigger
- new Folder Moved trigger
- new Room Updated trigger
- new Form Submitted trigger
- new Form Filled Out trigger
- new Find Room search
- new Find User search
- new Get File and Get Room actions
- new Delete File action
- new Rename File action
- new Rename Folder action
- new Move File, Copy File, Move Folder and Copy Folder actions
- new Unarchive Room action
- new Remove User from Room action
- new Get Room Members action
- new Add Room Tags and Remove Room Tags actions
- new Convert File action
- new List Folder Contents action
- new Create File with Content action
- new Get File External Link action
- new Lock File and Unlock File actions
- new Get Folder External Link action
- new Create Room from Template action
- new Change User Type action
- new Disable User and Enable User actions
- actions wait up to 20 seconds for long DocSpace operations
- failed actions show as errors, not as halted; errors about missing rights or tariff limits are clear; Upload File doesn't ask to reconnect the account when the server of the file URL refuses access
- Archive Room returns the room; Invite Guest and Download File return more data; Upload File and Find File return titles without the extension, like other actions
- Delete Folder from Files Section can delete a folder for good; the delete actions say that rooms have no Trash
- fix Remove User from Room in rooms with more than 100 members
- Get External Link is now Get Room External Link and Share Room is now Add User to Room; Get Room External Link can get the link without creating it; room and user fields can use Find Room and Find User; clearer help texts
- Add User to Room and Invite Guest can turn off the email or change its text

## 1.1.0
- new inviteGuest action
- updated room type
- updated role list for inviting users
- available invitation roles now depend on the current user's role

## 1.0.1
- fix security vulnerability with z.request() and z.stashFile()

## 1.0.0
- Basic authorizarion in DocSpace
- Polling for triggers 
- Common actions
