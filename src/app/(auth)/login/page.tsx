export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="admin@metria.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
