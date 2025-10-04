/**
 * Avatar Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over the Avatar primitive with semantic tokens.
 * Provides accessible avatar components with proper fallbacks.
 */

import { 
  Avatar as AvatarPrimitive, 
  AvatarImage as AvatarImagePrimitive, 
  AvatarFallback as AvatarFallbackPrimitive 
} from '../primitives/avatar';

const Avatar = AvatarPrimitive;
const AvatarImage = AvatarImagePrimitive;
const AvatarFallback = AvatarFallbackPrimitive;

export { Avatar, AvatarImage, AvatarFallback };
