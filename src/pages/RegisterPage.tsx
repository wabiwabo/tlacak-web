import { LoginLayout } from '@/features/auth/LoginLayout';
import { RegisterForm } from '@/features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <LoginLayout>
      <RegisterForm />
    </LoginLayout>
  );
}
