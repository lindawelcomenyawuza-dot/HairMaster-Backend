export const typeDefs = `
  type Product {
    id: ID!
    businessId: ID!
    name: String!
    price: Float!
    currency: String
    images: [String]
    description: String
    category: String
    deliveryAvailable: Boolean!
    deliveryFee: Float
    deliveryAreas: [String]
    inStock: Boolean!
    createdAt: String!
  }
`;
