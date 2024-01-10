//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {import("./people.js").User} User
 */

/** @type {User} */
const user = {
  firstName: "John",
  lastName: "Doe",
  userName: "john.doe",
  email: "john.doe@example.com",
  status: 1,
  activationStatus: 1,
  department: "",
  workFrom: "2023-01-12T00:00:00.0000000+03:00",
  avatarMax: "/static/images/default_user_photo_size_200-200.png",
  avatarMedium: "/static/images/default_user_photo_size_48-48.png",
  avatar: "/static/images/default_user_photo_size_82-82.png",
  isAdmin: true,
  isRoomAdmin: false,
  isLDAP: false,
  listAdminModules: [
    "files",
    "people"
  ],
  isOwner: true,
  isVisitor: false,
  isCollaborator: false,
  mobilePhone: "+555 555 1234",
  mobilePhoneActivationStatus: 0,
  isSSO: false,
  quotaLimit: 0,
  usedSpace: 0,
  id: "11111111-2222-3333-4444-555555555555",
  displayName: "John Doe",
  avatarSmall: "/static/images/default_user_photo_size_32-32.png",
  profileUrl: "https://johndoe.example.io/accounts/view/john.doe",
  hasAvatar: false
}

module.exports = { user }
