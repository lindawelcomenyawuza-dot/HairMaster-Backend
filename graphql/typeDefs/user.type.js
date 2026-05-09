export const typeDefs = `
  type PaymentRecord {
    id: ID!
    amount: Float!
    currency: String!
    date: String!
    status: String!
    type: String!
  }

  type Subscription {
    isActive: Boolean!
    startDate: String
    endDate: String
    isTrial: Boolean!
    trialEndsAt: String
    monthlyFee: Float
    currency: String
    paymentHistory: [PaymentRecord]
  }

  type StaffMember {
    id: ID!
    name: String!
    role: String!
    email: String!
    phone: String!
    avatar: String!
    specialties: [String]
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    accountType: String!
    avatar: String
    avatarKey: String
    bio: String
    followers: Int
    following: Int
    location: String
    country: String
    currency: String
    businessName: String
    isVerified: Boolean
    consentAccepted: Boolean
    consentTimestamp: String
    verificationBadge: String
    subscription: Subscription
    staff: [StaffMember]
    savedPosts: [String]
    referralCode: String
    loyaltyPoints: Int
    darkMode: Boolean
    language: String
    posts: Int
    totalSpent: Float
    discountTokens: Int
    isFollowing: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type DiscountToken {
    id: ID!
    code: String!
    discount: Int!
    pointCost: Int!
    used: Boolean!
    usedAt: String
    expiresAt: String!
    earnedAt: String!
  }

  type RedeemResult {
    token: DiscountToken!
    newLoyaltyPoints: Int!
  }

  type TokenTier {
    label: String!
    pointCost: Int!
    discount: Int!
    description: String!
  }
`;
