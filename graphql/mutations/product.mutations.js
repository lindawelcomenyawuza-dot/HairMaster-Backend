export const mutations = `
  createProduct(
    name: String!
    price: Float!
    currency: String
    images: [String]
    description: String
    category: String
    deliveryAvailable: Boolean
    deliveryFee: Float
    deliveryAreas: [String]
  ): Product
  updateProduct(
    id: ID!
    name: String
    price: Float
    description: String
    inStock: Boolean
  ): Product
  deleteProduct(id: ID!): Boolean
`;
