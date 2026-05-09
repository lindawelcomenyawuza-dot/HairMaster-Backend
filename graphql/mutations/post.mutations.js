export const mutations = `
  createPost(
    type: String
    image: String!
    imageKey: String
    images: [String]
    imageKeys: [String]
    styleName: String!
    barberName: String
    barberShop: String
    salonId: ID
    stylistId: ID
    location: String
    price: Float
    currency: String
    description: String
    gender: String
    hashtags: [String]
    bookingId: String
  ): Post
  repost(originalPostId: ID!): Post
  toggleLike(postId: ID!): Post
  addComment(postId: ID!, content: String!): Post
  editComment(postId: ID!, commentId: ID!, content: String!): Post
  deleteComment(postId: ID!, commentId: ID!): Post
  reportComment(postId: ID!, commentId: ID!, reason: String): Boolean
  toggleSavePost(postId: ID!): Post
`;
