import { BillingCalendar } from './BillingCalendar';
import { NotificationReminderSettings } from './NotificationReminderSettings';
import { NotificationTestPanel } from './NotificationTestPanel';
import { PushNotificationSettings } from './PushNotificationSettings';
import { TelegramNotificationSettings } from './TelegramNotificationSettings';
import type { Subscription } from '../lib/subscriptions';

export type ToolTab = 'calendar' | 'telegram' | 'push';

type Props = {
  activeTool: ToolTab;
  subscriptions: Subscription[];
  toolTabs: Array<{ id: ToolTab; label: string }>;
  onToolChange: (tool: ToolTab) => void;
};

export function DashboardTools({ activeTool, onToolChange, subscriptions, toolTabs }: Props) {
  return (
    <>
      <div className="tool-tabs" aria-label="Dashboard tools">
        {toolTabs.map((tab) => (
          <button
            className={activeTool === tab.id ? 'active' : ''}
            key={tab.id}
            type="button"
            onClick={() => onToolChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTool === 'calendar' && <BillingCalendar subscriptions={subscriptions} />}
      {activeTool === 'telegram' && (
        <>
          <NotificationReminderSettings />
          <TelegramNotificationSettings />
          <NotificationTestPanel />
        </>
      )}
      {activeTool === 'push' && (
        <>
          <NotificationReminderSettings />
          <PushNotificationSettings />
          <NotificationTestPanel />
        </>
      )}
    </>
  );
}
