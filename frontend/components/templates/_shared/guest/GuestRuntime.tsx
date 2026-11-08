'use client';
import { useCallback, useContext, useState, type ReactNode } from 'react';
import { GuestExecutionContext, GuestFeedbackContext } from './useGuestSubmission';
import { MasterPreviewContext } from '../slots/preview';

/** One write/feedback policy for ordinary previews, Studio simulations and live invitations. */
export default function GuestRuntime({ preview = false, children }: { preview?: boolean; children: ReactNode }) {
  const simulation = useContext(MasterPreviewContext);
  const [message, setMessage] = useState('');
  const report = useCallback((next: string) => setMessage(next), []);
  return <GuestExecutionContext.Provider value={simulation ? 'simulation' : preview ? 'preview' : 'live'}>
    <GuestFeedbackContext.Provider value={report}>
      {children}
      {message && <div role="status" style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 30000, maxWidth: 'min(90%, 420px)', padding: '12px 16px', background: '#fff', color: '#222', borderRadius: 8, boxShadow: '0 3px 20px #0003' }}>
        {message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss message" style={{ marginLeft: 12 }}>×</button>
      </div>}
    </GuestFeedbackContext.Provider>
  </GuestExecutionContext.Provider>;
}
