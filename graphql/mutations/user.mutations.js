export const mutations = `
  register(
    name: String!
    email: String!
    password: String!
    phone: String!
    consentAccepted: Boolean!
    accountType: String
  ): AuthPayload
  signup(
    name: String!
    email: String!
    password: String!
    phone: String
    consentAccepted: Boolean
    accountType: String
  ): SignupPayload
  login(email: String!, password: String!): AuthPayload
  verifyEmail(token: String!): SignupPayload
  forgotPassword(email: String!): Boolean
  resetPassword(token: String!, password: String!): Boolean
  toggleFollow(userId: ID!): User
  redeemPoints(pointCost: Int!): RedeemResult
  useToken(code: String!): DiscountToken
  updateProfile(
    bio: String
    avatar: String
    avatarKey: String
    location: String
    country: String
    currency: String
    businessName: String
    darkMode: Boolean
    language: String
  ): User
  updateProfileSettings(
    name: String
    bio: String
    avatar: String
    avatarKey: String
    location: String
    country: String
    currency: String
    businessName: String
    darkMode: Boolean
    language: String
  ): User
`;
