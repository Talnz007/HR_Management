import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserForAvatar {
  first_name: string;
  last_name: string;
  profile_picture_key?: string | null;
}

interface ProfileAvatarProps {
  user: UserForAvatar;
  className?: string;
}

const getInitials = (firstName?: string, lastName?: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export function ProfileAvatar({ user, className }: ProfileAvatarProps) {
  const imageUrl = user.profile_picture_key
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/media/profile_pictures/${user.profile_picture_key}`
    : undefined;

  const altText = `Profile picture of ${user.first_name} ${user.last_name}`;

  return (
    <Avatar className={className}>
      <AvatarImage src={imageUrl} alt={altText} />
      <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
    </Avatar>
  );
}
