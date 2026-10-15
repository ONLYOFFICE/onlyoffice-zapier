//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

/**
 * @typedef {import("./people.js").Account} Account
 * @typedef {import("./people.js").User} User
 */

/** @type {Account} */
const account = {
  displayName: "John Doe",
  id: "11111111-2222-3333-4444-555555555555",
  profileUrl: "https://johndoe.onlyoffice.io/accounts/view/john.doe"
}

/** @type {User} */
const user = {
  activationStatus: 1,
  avatar: "/static/images/default_user_photo_size_82-82.png",
  avatarMax: "/static/images/default_user_photo_size_200-200.png",
  avatarMedium: "/static/images/default_user_photo_size_48-48.png",
  avatarSmall: "/static/images/default_user_photo_size_32-32.png",
  department: "",
  displayName: "John Doe",
  email: "john.doe@example.com",
  firstName: "John",
  hasAvatar: false,
  id: "11111111-2222-3333-4444-555555555555",
  isAdmin: true,
  isCollaborator: false,
  isLDAP: false,
  isOwner: true,
  isRoomAdmin: false,
  isSSO: false,
  isVisitor: false,
  lastName: "Doe",
  mobilePhoneActivationStatus: 0,
  profileUrl: "https://johndoe.example.io/accounts/view/john.doe",
  status: 1,
  usedSpace: 0,
  userName: "john.doe"
}

/** @type {User} */
const invitedUser = {
  activationStatus: 2,
  avatar: "/static/images/default_user_photo_size_82-82.png",
  avatarMax: "/static/images/default_user_photo_size_200-200.png",
  avatarMedium: "/static/images/default_user_photo_size_48-48.png",
  avatarOriginal: "/static/images/default_user_photo_size_200-200.png",
  avatarSmall: "/static/images/default_user_photo_size_32-32.png",
  department: "",
  displayName: "jane.doe@example.com",
  email: "jane.doe@example.com",
  firstName: "",
  hasAvatar: false,
  id: "22222222-3333-4444-5555-666666666666",
  isAdmin: false,
  isAnonim: false,
  isCollaborator: true,
  isLDAP: false,
  isOwner: false,
  isRoomAdmin: false,
  isSSO: false,
  isVisitor: false,
  lastName: "",
  mobilePhoneActivationStatus: 0,
  profileUrl: "https://example.onlyoffice.com/accounts/people/filter?search=jane.doe%40example.com",
  registrationDate: "2026-01-01T09:00:00.0000000+00:00",
  status: 4,
  userName: "jane.doe"
}

module.exports = { account, invitedUser, user }
