'use client';

import { motion } from 'framer-motion';
import { Guest } from '@/lib/api';
import { StatCard, Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';

interface OverviewTabProps {
  stats: {
    totalGuests: number;
    totalAttending: number;
    totalNotAttending: number;
    brideSide: number;
    groomSide: number;
    totalWishes: number;
  };
  guests: Guest[];
  isRsvpOpen: boolean;
  onToggleRsvp: (isRsvpOpen: boolean) => void;
  /** "Bride/Groom side" only applies to WEDDING events. Defaults true so existing (WEDDING)
   *  call sites are unchanged. */
  showSide?: boolean;
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export default function OverviewTab({ stats, guests, isRsvpOpen, onToggleRsvp, showSide = true }: OverviewTabProps) {
  const recentGuests = [...guests]
    .sort((a, b) => new Date(b.respondedDate || 0).getTime() - new Date(a.respondedDate || 0).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* RSVP Status */}
      <Card padding="16px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)' }}>
              RSVP Status
            </p>
            <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
              {isRsvpOpen ? 'Guests can currently submit RSVPs.' : 'RSVPs are closed — the public form is disabled.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: isRsvpOpen ? 'var(--success)' : 'var(--danger)' }}>
              {isRsvpOpen ? 'Open' : 'Closed'}
            </span>
            <Switch checked={isRsvpOpen} onChange={e => onToggleRsvp(e.target.checked)} />
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="lg:grid-cols-4">
        <StatCard
          label="Total RSVPs"
          value={stats.totalGuests}
          icon={<Icon name="clipboard" size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Attending"
          value={stats.totalAttending}
          sublabel="guests"
          icon={<Icon name="check-circle" size={16} />}
          tone="success"
        />
        <StatCard
          label="Not Attending"
          value={stats.totalNotAttending}
          icon={<Icon name="x-circle" size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Wishes"
          value={stats.totalWishes}
          icon={<Icon name="message-circle" size={16} />}
          tone="gold"
        />
      </div>

      {/* Distribution */}
      <div style={{ display: 'grid', gap: 16 }} className={showSide ? 'md:grid-cols-2' : undefined}>
        {/* Guest distribution — Bride/Groom side only applies to WEDDING events */}
        {showSide && (
          <Card padding="20px">
            <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Guest Distribution
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="heart" size={13} style={{ color: 'var(--brand)' }} /> Bride&apos;s Side
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {stats.brideSide}
                  </span>
                </div>
                <ProgressBar value={pct(stats.brideSide, stats.totalGuests)} tone="brand" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="user" size={13} style={{ color: 'var(--text-muted)' }} /> Groom&apos;s Side
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {stats.groomSide}
                  </span>
                </div>
                <ProgressBar value={pct(stats.groomSide, stats.totalGuests)} tone="neutral" />
              </div>
            </div>
          </Card>
        )}

        {/* Attendance status */}
        <Card padding="20px">
          <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)' }}>
            Attendance Status
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="check-circle" size={13} style={{ color: 'var(--success)' }} /> Attending
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {stats.totalAttending}
                </span>
              </div>
              <ProgressBar value={pct(stats.totalAttending, stats.totalAttending + stats.totalNotAttending)} tone="success" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="x-circle" size={13} style={{ color: 'var(--danger)' }} /> Not Attending
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {stats.totalNotAttending}
                </span>
              </div>
              <ProgressBar value={pct(stats.totalNotAttending, stats.totalAttending + stats.totalNotAttending)} tone="neutral" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent RSVPs */}
      <Card padding="0">
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-sunken)',
          fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
          fontWeight: 600, color: 'var(--text-muted)',
          letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}>
          Recent RSVPs
        </div>
        <div style={{ padding: '0 18px' }}>
          {recentGuests.length === 0 ? (
            <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', margin: 0 }}>
              No RSVPs yet
            </p>
          ) : (
            recentGuests.map((guest, i) => (
              <div
                key={guest.guestId}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 0',
                  borderBottom: i < recentGuests.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>
                    {guest.guestName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
                    {guest.guestSide === 'PRIMARY' ? 'Bride' : guest.guestSide === 'SECONDARY' ? 'Groom' : 'Unspecified'} side · {guest.numberOfAttendees} guest(s)
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge tone={guest.isAttending ? 'success' : 'danger'}>
                    {guest.isAttending ? 'Attending' : 'Not Attending'}
                  </Badge>
                  {guest.respondedDate && (
                    <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-subtle)' }}>
                      {new Date(guest.respondedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}
