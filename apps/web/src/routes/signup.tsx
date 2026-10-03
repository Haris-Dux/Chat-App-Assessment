import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { getCurrentUser } from '../features/auth/queries';
import { SignupForm } from '../features/auth/signup-form';

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (getCurrentUser(context.queryClient)) {
      throw redirect({ to: '/chat' });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a few seconds, then just tell us what you need."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm onSuccess={() => navigate({ to: '/chat' })} />
    </AuthLayout>
  );
}
