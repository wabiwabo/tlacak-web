import { LoginLayout } from '@/features/auth/LoginLayout';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <LoginLayout>
      <ResetPasswordForm />
    </LoginLayout>
  );
}
