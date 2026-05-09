import mongoose from 'mongoose';
import User from '../../models/User.js';
import { formatSalon, formatSalonStaffMember } from './shared.js';

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
    return (salon.staff || []).map(formatSalonStaffMember);
  },
};
