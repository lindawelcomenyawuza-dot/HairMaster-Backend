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

  type StaffSocialLinks {
    instagram: String
    tiktok: String
    website: String
  }

  input StaffSocialLinksInput {
    instagram: String
    tiktok: String
    website: String
  }

  input StaffInput {
    fullName: String!
    role: String!
    bio: String
    specialties: [String]
    profileImage: String
    profileImageKey: String
    phone: String
    email: String
    socialLinks: StaffSocialLinksInput
  }

  type BusinessStaffMember {
    id: ID!
    businessId: ID!
    fullName: String!
    displayName: String!
    role: String!
    bio: String
    specialties: [String]
    profileImage: String
    profileImageKey: String
    avatar: String
    phone: String
    email: String
    socialLinks: StaffSocialLinks
    createdAt: String!
  }
`;
