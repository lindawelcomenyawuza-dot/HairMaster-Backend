export const mutations = `
  sendMessage(receiverId: ID!, content: String!): Message
  createChat(type: String!, bookingId: String, participantId: ID!): Chat
  sendChatMessage(chatId: ID!, content: String!): Chat
`;
