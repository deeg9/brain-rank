"use client";

import { getInitials, getInitialsColor } from "@/lib/avatar";

interface PublicAvatarDisplayProps {
  username: string;
}

export function PublicAvatarDisplay({ username }: PublicAvatarDisplayProps) {
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${getInitialsColor(
        username,
        username
      )}`}
    >
      <span className="text-white text-2xl font-bold">
        {getInitials(username, username)}
      </span>
    </div>
  );
}
