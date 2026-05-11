export const mutations = `
  createStaff(input: StaffInput!): BusinessStaffMember
  updateStaff(id: ID!, input: StaffInput!): BusinessStaffMember
  deleteStaff(id: ID!): Boolean
`;
