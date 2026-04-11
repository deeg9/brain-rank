"use client";

import { getInitials, getInitialsColor } from "@/lib/avatar";

interface AvatarDisplayProps {
  username: string | null;
  email: string;
}

export function AvatarDisplay({ username, email }: AvatarDisplayProps) {
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${getInitialsColor(
        username,
        email
      )}`}
    >
      <span className="text-white text-2xl font-bold">
        {getInitials(username, email)}
      </span>
    </div>
  );
}
