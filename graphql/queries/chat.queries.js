export const queries = `
  conversations: [Conversation]
  messages(otherUserId: ID!): [Message]
  myChats: [Chat]
  chat(id: ID!): Chat
`;
