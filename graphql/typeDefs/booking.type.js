export const typeDefs = `
  type Booking {
    id: ID!
    userId: String
    barberId: String
    locationId: String
    postId: String
    styleName: String!
    barberName: String
    location: String
    price: Float!
    currency: String
    depositAmount: Float
    depositPaid: Boolean
    date: String!
    time: String!
    status: String!
    paymentMethod: String!
    paymentStatus: String
  }
`;
