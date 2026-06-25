/**
 * Theme Toggle - accessible button to switch between light/dark/system themes.
 * Uses lucide-react icons for sun/moon/monitor.
 */
import { Button } from "./ui/button";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const themeIcons: Record<string, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const Icon = themeIcons[theme] || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Current theme: ${themeLabels[theme]}. Click to change theme.`}
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
