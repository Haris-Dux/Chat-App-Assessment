import { loginSchema } from '@concierge/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../../components/ui/button';
import { FormError } from '../../components/ui/form-error';
import { TextField } from '../../components/ui/text-field';
import { BUSINESS_SLUG } from '../../config';
import { useLogin } from './queries';

const loginFormSchema = loginSchema.omit({ businessSlug: true });
type LoginValues = z.infer<typeof loginFormSchema>;

const demoAccount: LoginValues = { email: 'demo@lumenphysio.test', password: 'demo12345' };

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginFormSchema) });

  const submit = handleSubmit((values) =>
    login.mutate({ ...values, businessSlug: BUSINESS_SLUG }, { onSuccess }),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={login.error?.message} />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
      <button
        type="button"
        onClick={() => reset(demoAccount)}
        className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-left text-xs text-ink-soft transition hover:border-ink-faint"
      >
        <span className="font-semibold text-ink">Reviewing the demo?</span> Fill in the demo account
        <span className="mt-1 block font-mono text-ink-faint">
          {demoAccount.email} / {demoAccount.password}
        </span>
      </button>
    </form>
  );
}
