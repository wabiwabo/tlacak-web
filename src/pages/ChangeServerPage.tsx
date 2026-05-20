import { LoginLayout } from '@/features/auth/LoginLayout';
import { ChangeServerForm } from '@/features/auth/ChangeServerForm';

export default function ChangeServerPage() {
  return (
    <LoginLayout>
      <ChangeServerForm />
    </LoginLayout>
  );
}
