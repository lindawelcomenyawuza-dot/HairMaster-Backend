export const typeDefs = `
  type ChatMessage {
    id: ID!
    senderId: ID!
    content: String!
    createdAt: String!
  }

  type Chat {
    id: ID!
    type: String!
    bookingId: String
    participants: [String]
    status: String!
    expiresAt: String
    messages: [ChatMessage]
    createdAt: String!
  }

  type Message {
    id: ID!
    senderId: ID!
    receiverId: ID!
    content: String!
    timestamp: String!
    read: Boolean!
  }

  type Conversation {
    userId: ID!
    userName: String!
    userAvatar: String!
    lastMessage: String!
    lastMessageTime: String!
    unreadCount: Int!
  }
`;
