import { UserManager } from "@/widgets/user-manager";

/**
 * Halaman pengelolaan pengguna untuk admin. Membungkus widget `UserManager`.
 */
export function UsersView() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Pengguna
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola seluruh pengguna yang terdaftar di platform.
        </p>
      </header>

      <UserManager />
    </div>
  );
}
