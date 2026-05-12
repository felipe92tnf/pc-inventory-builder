import { Loader2 } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-blue-950 px-4 text-blue-100">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-400" aria-hidden />
      <p className="text-sm font-medium text-blue-100/85">Comprobando sesión…</p>
    </div>
  );
}
