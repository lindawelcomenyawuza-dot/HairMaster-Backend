export const queries = `
  me: User
  user(id: ID!): User
  users: [User]
  myTokens: [DiscountToken]
  tokenTiers: [TokenTier]
`;
