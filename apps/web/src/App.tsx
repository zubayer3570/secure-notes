import { useCallback, useEffect, useState } from 'react';
import { api, hasToken, onUnauthorized, setToken } from './api';
import { AuthView } from './AuthView';
import { MeContext, RunContext, type Run } from './session';
import { Shell } from './Shell';
import type { AuthResult, User } from './types';

export function App() {
  const [me, setMe] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(hasToken);
  const [error, setError] = useState('');

  const run = useCallback<Run>(async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
  }, []);

  const signIn = ({ token, user }: AuthResult) => {
    setToken(token);
    setMe(user);
  };

  useEffect(() => {
    onUnauthorized(logout);
    if (!hasToken()) return;
    api<User>('GET', '/users/me')
      .then(setMe)
      .catch(logout)
      .finally(() => setRestoring(false));
  }, [logout]);

  return (
    <RunContext value={run}>
      <h1>Secure Notes</h1>
      <p className="error" data-testid="error">
        {error}
      </p>
      {!restoring && !me && <AuthView onSignIn={signIn} />}
      {me && (
        <MeContext value={me}>
          <Shell onProfileSaved={setMe} onLogout={logout} />
        </MeContext>
      )}
    </RunContext>
  );
}
