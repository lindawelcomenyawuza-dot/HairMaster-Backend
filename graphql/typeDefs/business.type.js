export const typeDefs = `
  type SalonSearchResult {
    id: ID!
    name: String!
    city: String
    logo: String
  }

  type SalonStaffMember {
    id: ID!
    displayName: String!
    avatar: String
    role: String!
  }
`;
