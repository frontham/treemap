import { LoginForm } from '@/components/auth/LoginForm';
import { Wordmark } from '@/components/brand/Logo';
import { BuildInfo } from '@/components/layout/BuildInfo';

export const metadata = { title: 'Sign in · TreeMap' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper p-6">
      <Wordmark markSize={48} className="[&>span]:text-2xl" />
      <LoginForm />
      <BuildInfo />
    </main>
  );
}
