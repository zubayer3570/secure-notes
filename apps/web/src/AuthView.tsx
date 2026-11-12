import { api } from './api';
import { PasswordField } from './PasswordField';
import { useSubmit } from './session';
import type { AuthResult } from './types';
import { formValues, userPayload } from './utils';

export function AuthView({ onSignIn }: { onSignIn: (result: AuthResult) => void }) {
  const submit = useSubmit();
  const login = submit(async (form) => onSignIn(await api<AuthResult>('POST', '/auth/login', formValues(form))));
  const register = submit(async (form) => onSignIn(await api<AuthResult>('POST', '/auth/register', userPayload(form))));

  return (
    <>
      <section>
        <h2>Login</h2>
        <form onSubmit={login} data-testid="login-form">
          <input name="email" type="email" placeholder="Email" required data-testid="login-email" />
          <input name="password" type="password" placeholder="Password" required data-testid="login-password" />
          <button data-testid="login-submit">Login</button>
        </form>
      </section>
      <section>
        <h2>Register</h2>
        <form onSubmit={register} data-testid="register-form">
          <input name="name" placeholder="Name" required data-testid="register-name" />
          <input name="email" type="email" placeholder="Email" required data-testid="register-email" />
          <PasswordField prefix="register" placeholder="Password (min 10, mixed case, number, symbol)" required />
          <input name="interests" placeholder="Interests, comma separated" data-testid="register-interests" />
          <button data-testid="register-submit">Register</button>
        </form>
      </section>
    </>
  );
}
