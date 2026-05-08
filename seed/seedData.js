import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/User.js';
import Post from '../models/Post.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Post.deleteMany({});
  await Booking.deleteMany({});
  await Message.deleteMany({});
  console.log('Cleared existing data');

  const password = await bcrypt.hash('password123', 10);

  const marcus = new User({
    name: 'Marcus Johnson',
    email: 'marcus@email.com',
    password,
    accountType: 'business',
    avatar: 'https://images.unsplash.com/photo-1759142016096-a9d1a5ebcc09?w=150',
    bio: 'Professional barber with 10+ years of experience. Specializing in fades and modern cuts.',
    followers: 1245,
    following: 320,
    location: 'New York, NY',
    country: 'USA',
    currency: 'USD',
    businessName: 'Elite Cuts Barbershop',
    subscription: {
      isActive: true,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-01'),
      isTrial: false,
      trialEndsAt: new Date('2026-02-15'),
      monthlyFee: 100,
      currency: 'ZAR',
      paymentHistory: [
        {
          amount: 100,
          currency: 'ZAR',
          date: new Date('2026-02-01'),
          status: 'completed',
          type: 'subscription',
        },
      ],
    },
    staff: [
      {
        name: 'James Wilson',
        role: 'Senior Barber',
        email: 'james@elitecuts.com',
        phone: '(212) 555-0124',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        specialties: ['Classic Cuts', 'Hot Towel Shave'],
      },
    ],
  });

  const sarah = new User({
    name: 'Sarah Williams',
    email: 'sarah@email.com',
    password,
    accountType: 'business',
    avatar: 'https://images.unsplash.com/photo-1583331030595-6601e6c7b5d5?w=150',
    bio: 'Celebrity hairstylist. Braids, weaves, and natural hair expert.',
    followers: 3420,
    following: 890,
    location: 'Los Angeles, CA',
    country: 'USA',
    currency: 'USD',
    businessName: 'Glamour Hair Studio',
    subscription: {
      isActive: true,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-15'),
      isTrial: true,
      trialEndsAt: new Date('2026-03-15'),
      monthlyFee: 100,
      currency: 'ZAR',
      paymentHistory: [],
    },
  });

  const david = new User({
    name: 'David Chen',
    email: 'david@email.com',
    password,
    accountType: 'personal',
    avatar: 'https://images.unsplash.com/photo-1618049049816-43a00d5b0c3d?w=150',
    bio: 'Hair enthusiast sharing my journey',
    followers: 542,
    following: 678,
    location: 'Chicago, IL',
    country: 'USA',
    currency: 'USD',
  });

  await marcus.save();
  await sarah.save();
  await david.save();
  console.log('Users seeded');

  const post1 = new Post({
    userId: marcus._id,
    userName: 'Marcus Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1759142016096-a9d1a5ebcc09?w=150',
    accountType: 'business',
    image: 'https://images.unsplash.com/photo-1618049049816-43a00d5b0c3d?w=800',
    styleName: 'Mid Fade with Textured Top',
    barberName: 'Marcus Johnson',
    barberShop: 'Elite Cuts Barbershop',
    location: 'New York, NY',
    price: 45,
    currency: 'USD',
    rating: 4.8,
    likes: 234,
    description: 'Clean mid fade with textured styling on top. Perfect for a professional yet stylish look.',
    gender: 'male',
    hashtags: ['fade', 'menscut', 'hairstyle', 'barber'],
    taggedUsers: [],
    comments: [],
    createdAt: new Date('2026-03-20'),
  });

  const post2 = new Post({
    userId: sarah._id,
    userName: 'Sarah Williams',
    userAvatar: 'https://images.unsplash.com/photo-1583331030595-6601e6c7b5d5?w=150',
    accountType: 'business',
    image: 'https://images.unsplash.com/photo-1702236240794-58dc4c6895e5?w=800',
    styleName: 'Box Braids with Curly Ends',
    barberName: 'Sarah Williams',
    barberShop: 'Glamour Hair Studio',
    location: 'Los Angeles, CA',
    price: 180,
    currency: 'USD',
    rating: 5.0,
    likes: 567,
    description: 'Beautiful box braids with curly ends. Protective style that lasts 6-8 weeks.',
    gender: 'female',
    products: [
      { name: "Curly Frontal 18\"", price: 120, type: 'frontal' },
      { name: 'Edge Control', price: 15, type: 'extension' },
    ],
    hashtags: ['boxbraids', 'protectivestyles', 'braids', 'naturalhair'],
    taggedUsers: [{ userId: david._id.toString(), name: 'David Chen' }],
    comments: [],
    createdAt: new Date('2026-03-19'),
  });

  const post3 = new Post({
    userId: sarah._id,
    userName: 'Sarah Williams',
    userAvatar: 'https://images.unsplash.com/photo-1583331030595-6601e6c7b5d5?w=150',
    accountType: 'business',
    image: 'https://images.unsplash.com/photo-1565699774381-d421d9e7ad41?w=800',
    styleName: 'Balayage Highlights',
    barberName: 'Sarah Williams',
    barberShop: 'Glamour Hair Studio',
    location: 'Los Angeles, CA',
    price: 250,
    currency: 'USD',
    rating: 4.9,
    likes: 892,
    description: 'Stunning balayage highlights with blonde tones. Includes cut and style.',
    gender: 'female',
    hashtags: ['balayage', 'highlights', 'haircolor'],
    comments: [],
    createdAt: new Date('2026-03-18'),
  });

  const post4 = new Post({
    userId: marcus._id,
    userName: 'Marcus Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1759142016096-a9d1a5ebcc09?w=150',
    accountType: 'business',
    image: 'https://images.unsplash.com/photo-1761064039763-0d9aa5124510?w=800',
    styleName: 'Classic Taper Fade',
    barberName: 'Marcus Johnson',
    barberShop: 'Elite Cuts Barbershop',
    location: 'New York, NY',
    price: 40,
    currency: 'USD',
    rating: 4.7,
    likes: 156,
    description: 'Timeless taper fade with a clean lineup.',
    gender: 'male',
    hashtags: ['taperfade', 'classic', 'barbershop'],
    comments: [],
    createdAt: new Date('2026-03-17'),
  });

  await post1.save();
  await post2.save();
  await post3.save();
  await post4.save();
  console.log('Posts seeded');

  const booking1 = new Booking({
    userId: david._id,
    postId: post2._id,
    styleName: 'Box Braids with Curly Ends',
    barberName: 'Sarah Williams',
    barberId: sarah._id,
    location: 'Los Angeles, CA',
    price: 180,
    currency: 'USD',
    depositAmount: 90,
    depositPaid: true,
    date: new Date('2026-03-25'),
    time: '10:00 AM',
    status: 'upcoming',
    paymentMethod: 'online',
    paymentStatus: 'partial',
  });

  const booking2 = new Booking({
    userId: david._id,
    postId: post1._id,
    styleName: 'Mid Fade with Textured Top',
    barberName: 'Marcus Johnson',
    barberId: marcus._id,
    location: 'New York, NY',
    price: 45,
    currency: 'USD',
    depositAmount: 45,
    depositPaid: true,
    date: new Date('2026-03-15'),
    time: '2:00 PM',
    status: 'completed',
    paymentMethod: 'offline',
    paymentStatus: 'completed',
  });

  await booking1.save();
  await booking2.save();
  console.log('Bookings seeded');

  const msg1 = new Message({
    senderId: marcus._id,
    receiverId: david._id,
    content: 'Yes, I have availability tomorrow at 2pm',
    read: false,
    createdAt: new Date('2026-03-21T14:30:00'),
  });

  const msg2 = new Message({
    senderId: sarah._id,
    receiverId: david._id,
    content: 'The braids usually take about 4-5 hours',
    read: true,
    createdAt: new Date('2026-03-20T10:15:00'),
  });

  await msg1.save();
  await msg2.save();
  console.log('Messages seeded');

  console.log('\nSeed complete!');
  console.log('Test accounts:');
  console.log('  marcus@email.com / password123  (business)');
  console.log('  sarah@email.com  / password123  (business)');
  console.log('  david@email.com  / password123  (personal)');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
