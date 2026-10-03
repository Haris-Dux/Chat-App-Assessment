import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { LoginForm } from '../features/auth/login-form';
import { getCurrentUser } from '../features/auth/queries';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (getCurrentUser(context.queryClient)) {
      throw redirect({ to: '/chat' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate({ to: '/chat' })} />
    </AuthLayout>
  );
}
