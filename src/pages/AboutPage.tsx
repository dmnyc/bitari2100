import React from 'react';
import { CartridgeLabel } from '../components/atari/CartridgeLabel';

interface AboutPageProps {
  onBack: () => void;
}

const NOSTR_PROFILE_URL = 'https://zap.cooking/user/npub1aeh2zw4elewy5682lxc6xnlqzjnxksq303gwu2npfaxd49vmde6qcq4nwx';

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-2 p-3 border-b-2 border-dashed border-atari-darkgray">
        <button onClick={onBack} className="font-pixel text-base text-atari-midgray hover:text-atari-orange">
          {'<'} BACK
        </button>
        <span className="font-pixel text-lg text-atari-bright uppercase tracking-wider">
          ABOUT
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <CartridgeLabel />

        <div className="pixel-border p-4 max-w-xs w-full space-y-4">
          <div className="text-center">
            <div className="font-pixel text-base text-atari-midgray tracking-wider mb-2">
              CREATED BY
            </div>
            <a
              href={NOSTR_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-lg text-atari-orange hover:text-atari-orange-lit"
            >
              @daniel
            </a>
          </div>

          <div className="border-t border-dashed border-atari-darkgray" />

          <div className="text-center space-y-2">
            <div className="font-pixel text-base text-atari-midgray tracking-wider">
              WALLET ENGINE
            </div>
            <div className="font-pixel text-base text-atari-lightgray">
              BREEZ SDK SPARK
            </div>
          </div>

          <div className="border-t border-dashed border-atari-darkgray" />

          <div className="text-center">
            <div className="font-pixel text-base text-atari-midgray tracking-wider mb-1">
              VERSION
            </div>
            <div className="font-pixel text-base text-atari-lightgray">
              {import.meta.env.PACKAGE_VERSION || '0.1.0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
