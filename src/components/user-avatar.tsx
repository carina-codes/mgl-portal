import { cn } from "@/lib/utils";
import type { User } from "@/lib/mock-data";

export function UserAvatar({
  user,
  size = 28,
  className,
  backgroundColor,
}: {
  user: User;
  size?: number;
  className?: string;
  backgroundColor?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white ring-2 ring-card shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor || user.color,
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
  baseColor,
}: {
  userIds: string[];
  users: User[];
  max?: number;
  size?: number;
  baseColor?: string;
}) {
  const visible = userIds.slice(0, max);
  const remaining = userIds.length - visible.length;

  const getShade = (color: string | undefined, index: number) => {
    if (!color) return undefined;
    const cleanColor = color.replace("#", "");
    let hex = cleanColor;
    if (cleanColor.length === 3) {
      hex = cleanColor[0] + cleanColor[0] + cleanColor[1] + cleanColor[1] + cleanColor[2] + cleanColor[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const maxVal = Math.max(rNorm, gNorm, bNorm);
    const minVal = Math.min(rNorm, gNorm, bNorm);
    
    let h = 0;
    let s = 0;
    const l = (maxVal + minVal) / 2;
    
    if (maxVal !== minVal) {
      const d = maxVal - minVal;
      s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal);
      switch (maxVal) {
        case rNorm:
          h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
          break;
        case gNorm:
          h = (bNorm - rNorm) / d + 2;
          break;
        case bNorm:
          h = (rNorm - gNorm) / d + 4;
          break;
      }
      h /= 6;
    }
    
    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    
    const offsets = [0, 15, -12, 25, -20];
    const offset = offsets[index % offsets.length];
    const newL = Math.max(15, Math.min(85, Math.round(l * 100) + offset));
    
    return `hsl(${hDeg}, ${sPct}%, ${newL}%)`;
  };

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((id, idx) => {
        const u = users.find((x) => x.id === id);
        if (!u) return null;
        return <UserAvatar key={id} user={u} size={size} backgroundColor={getShade(baseColor, idx)} />;
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
