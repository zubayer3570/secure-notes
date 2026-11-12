import { model, Schema, type InferSchemaType } from 'mongoose';
import { normalizeInterests } from '../lib/interests.js';

export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user', required: true },
    interests: { type: [String], default: [], set: normalizeInterests },
  },
  { timestamps: true, versionKey: false },
);

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ interests: 1, name: 1, _id: 1 });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
