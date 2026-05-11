export const typeDefs = `
  type TaggedUser {
    id: String!
    name: String!
  }

  type Comment {
    id: ID!
    postId: ID!
    userId: ID!
    userName: String!
    userAvatar: String!
    content: String!
    createdAt: String!
    likes: Int!
    isLiked: Boolean!
  }

  type Post {
    id: ID!
    type: String!
    userId: ID!
    userName: String!
    userAvatar: String!
    userAvatarKey: String
    accountType: String!
    image: String!
    imageKey: String
    images: [String]
    imageKeys: [String]
    styleName: String!
    barberName: String
    barberShop: String
    salonId: String
    salonName: String
    stylistId: String
    stylistName: String
    stylistAvatar: String
    stylistRole: String
    stylistBio: String
    salonLogo: String
    location: String
    barberId: String
    bookingId: String
    originalPostId: String
    price: Float!
    currency: String
    isService: Boolean!
    rating: Float
    likes: Int!
    isLiked: Boolean!
    isSaved: Boolean!
    description: String
    gender: String
    createdAt: String!
    hashtags: [String]
    taggedUsers: [TaggedUser]
    comments: [Comment]
    commentsCount: Int!
    sharesCount: Int
  }
`;
