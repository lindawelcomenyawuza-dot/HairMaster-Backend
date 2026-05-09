export const queries = `
  searchSalons(search: String!): [SalonSearchResult]
  getSalonStaff(salonId: ID!): [SalonStaffMember]
`;
