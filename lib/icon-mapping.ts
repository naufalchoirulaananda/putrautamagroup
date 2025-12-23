import * as Icons from "lucide-react";

export function getIcon(name: string) {

  const IconComponent = (Icons as any)[name];
  return IconComponent ? IconComponent : null;
}
