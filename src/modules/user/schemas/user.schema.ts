import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../role/schemas/role.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  phoneNumber: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  password?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ type: Types.ObjectId, ref: Role.name })
  role?: Role | Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
