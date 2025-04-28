import { model, Types } from 'mongoose';
import { z } from 'zod';
import { zId, zodSchema } from '@zodyac/zod-mongoose';

export const UserZod = z.object({
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9]+$/)
    .unique(),
  email: z.string().email().unique(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}])[a-zA-Z\d!@#$%^&*()[\]{}]{8,30}$/)
    .optional(),
  googleId: z.string().unique().optional(),
  // TODO: S3 string
  avatar: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  ideas: z.array(zId('Idea')).optional().default([]),
  following: z.array(zId('User')).optional().default([]),
  followers: z.array(zId('User')).optional().default([]),
  role: z.enum(['user', 'admin']).optional().default('user'),
  settings: z.object({}).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

const UserSchema = zodSchema(UserZod, {
  timestamps: true,
});
UserSchema.index({ tags: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.path('password').select(false);
UserSchema.path('googleId').sparse(true);

export type IUser = z.infer<typeof UserZod> & { _id: Types.ObjectId };

export default model('User', UserSchema);
