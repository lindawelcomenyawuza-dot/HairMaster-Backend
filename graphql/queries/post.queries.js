export const queries = `
  posts(gender: String, search: String): [Post]
  post(id: ID!): Post
  userPosts(userId: ID!): [Post]
`;
