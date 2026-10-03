import { signupSchema } from '@concierge/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../../components/ui/button';
import { FormError } from '../../components/ui/form-error';
import { TextField } from '../../components/ui/text-field';
import { BUSINESS_SLUG } from '../../config';
import { useSignup } from './queries';

const signupFormSchema = signupSchema.omit({ businessSlug: true });
type SignupValues = z.infer<typeof signupFormSchema>;

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupFormSchema) });

  const submit = handleSubmit((values) =>
    signup.mutate({ ...values, businessSlug: BUSINESS_SLUG }, { onSuccess }),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={signup.error?.message} />
      <TextField
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={signup.isPending}>
        {signup.isPending ? 'Creating your account…' : 'Create account'}
      </Button>
    </form>
  );
}
