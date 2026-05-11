import mongoose from 'mongoose';
import User from '../../models/User.js';
import Staff from '../../models/Staff.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { getObjectKey } from '../../utils/media.js';
import { formatBusinessStaffMember, formatSalon, formatSalonStaffMember } from './shared.js';

function normalizeStaffInput(input = {}) {
  const fullName = String(input.fullName || '').trim();
  const role = String(input.role || '').trim();
  if (!fullName) throw new Error('Staff full name is required');
  if (!role) throw new Error('Staff role is required');

  return {
    fullName,
    role,
    bio: String(input.bio || '').trim(),
    specialties: (input.specialties || []).map(item => String(item).trim()).filter(Boolean),
    profileImage: String(input.profileImage || '').trim(),
    profileImageKey: input.profileImageKey || getObjectKey(input.profileImage),
    phone: String(input.phone || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    socialLinks: {
      instagram: String(input.socialLinks?.instagram || '').trim(),
      tiktok: String(input.socialLinks?.tiktok || '').trim(),
      website: String(input.socialLinks?.website || '').trim(),
    },
  };
}

async function requireBusinessUser(req) {
  const authUser = requireAuth(getUser(req));
  const user = await User.findById(authUser.id);
  if (!user || user.accountType !== 'business') {
    throw new Error('Only business accounts can manage staff');
  }
  return user;
}

export const resolvers = {
  searchSalons: async ({ search }) => {
    const term = (search || '').trim();
    if (term.length < 2) return [];
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const salons = await User.find({
      accountType: 'business',
      $or: [
        { businessName: re },
        { name: re },
        { location: re },
      ],
    }).sort({ businessName: 1, name: 1 }).limit(12);
    return salons.map(formatSalon);
  },

  getSalonStaff: async ({ salonId }) => {
    if (!mongoose.Types.ObjectId.isValid(salonId)) throw new Error('Invalid salon');
    const salon = await User.findOne({ _id: salonId, accountType: 'business' });
    if (!salon) throw new Error('Salon not found');
    const staff = await Staff.find({ businessId: salon._id }).sort({ fullName: 1 });
    return staff.map(formatSalonStaffMember);
  },

  getBusinessStaff: async ({ businessId }, { req }) => {
    const authUser = getUser(req);
    const targetBusinessId = businessId || authUser?.id;
    if (!targetBusinessId || !mongoose.Types.ObjectId.isValid(targetBusinessId)) {
      throw new Error('Invalid business');
    }

    const business = await User.findOne({ _id: targetBusinessId, accountType: 'business' });
    if (!business) throw new Error('Business not found');

    const staff = await Staff.find({ businessId: business._id }).sort({ createdAt: -1 });
    return staff.map(formatBusinessStaffMember);
  },

  createStaff: async ({ input }, { req }) => {
    const business = await requireBusinessUser(req);
    const staff = await Staff.create({
      businessId: business._id,
      ...normalizeStaffInput(input),
    });
    return formatBusinessStaffMember(staff);
  },

  updateStaff: async ({ id, input }, { req }) => {
    const business = await requireBusinessUser(req);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid staff member');

    const staff = await Staff.findOne({ _id: id, businessId: business._id });
    if (!staff) throw new Error('Staff member not found');

    Object.assign(staff, normalizeStaffInput(input));
    await staff.save();
    return formatBusinessStaffMember(staff);
  },

  deleteStaff: async ({ id }, { req }) => {
    const business = await requireBusinessUser(req);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid staff member');

    const result = await Staff.deleteOne({ _id: id, businessId: business._id });
    if (result.deletedCount === 0) throw new Error('Staff member not found');
    return true;
  },
};
