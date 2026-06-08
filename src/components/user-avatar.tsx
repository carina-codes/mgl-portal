import { cn } from "@/lib/utils";
import type { User } from "@/lib/mock-data";

export function UserAvatar({
  user,
  size = 28,
  className,
}: {
  user: User;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white ring-2 ring-card",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: user.color,
        fontSize: Math.max(10, size * 0.4),
      }}
      title={user.name}
    >
      {user.avatar}
    </div>
  );
}

export function AvatarStack({
  userIds,
  users,
  max = 4,
  size = 26,
}: {
  userIds: string[];
  users: User[];
  max?: number;
  size?: number;
}) {
  const visible = userIds.slice(0, max);
  const remaining = userIds.length - visible.length;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((id) => {
        const u = users.find((x) => x.id === id);
        if (!u) return null;
        return <UserAvatar key={id} user={u} size={size} />;
      })}
      {remaining > 0 && (
        <div
          className="inline-flex items-center justify-center rounded-full bg-muted text-foreground ring-2 ring-card font-medium"
          style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
