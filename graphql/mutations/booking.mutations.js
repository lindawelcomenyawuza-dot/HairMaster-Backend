export const mutations = `
  createBooking(
    postId: String
    barberId: String
    locationId: String
    styleName: String!
    barberName: String
    location: String
    price: Float!
    currency: String
    depositAmount: Float
    date: String!
    time: String!
    paymentMethod: String!
  ): Booking
  updateBooking(id: ID!, status: String, paymentStatus: String): Booking
`;
