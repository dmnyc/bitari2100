import { ReactNode, useState } from 'react';
import { AtariButton } from './atari/AtariButton';
import { AtariInput } from './atari/AtariInput';

interface StagingGateProps {
  children: ReactNode;
}

/**
 * Password gate for staging environment.
 * Only shows if VITE_STAGING_PASSWORD is set.
 */
export default function StagingGate({ children }: StagingGateProps) {
  const stagingPassword = import.meta.env.VITE_STAGING_PASSWORD;
  const [authenticated, setAuthenticated] = useState(!stagingPassword);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (authenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === stagingPassword) {
      setAuthenticated(true);
    } else {
      setError('ACCESS DENIED');
    }
  };

  return (
    <div className="min-h-screen bg-atari-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="pixel-border-double p-6 w-full max-w-xs">
        <div className="font-pixel text-lg text-atari-orange text-center mb-4">
          STAGING ACCESS
        </div>
        <AtariInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PASSWORD"
          error={error}
        />
        <AtariButton variant="primary" fullWidth className="mt-4" type="submit">
          ENTER
        </AtariButton>
      </form>
    </div>
  );
}
