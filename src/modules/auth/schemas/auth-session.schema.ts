import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type AuthSessionDocument = HydratedDocument<AuthSession>;

@Schema({ timestamps: true })
export class AuthSession {
  createdAt?: Date;
  updatedAt?: Date;
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'Unknown' })
  userAgent: string;

  @Prop({ default: 'Unknown Device' })
  deviceDisplayName: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
