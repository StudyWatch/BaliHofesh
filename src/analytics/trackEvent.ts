// src/analytics/trackEvent.ts
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  metric_name: string;
  metric_value?: number;
  metadata?: Record<string, any>;
}

let eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

export function trackEvent(metric_name: string, metadata: Record<string, any> = {}, metric_value = 1) {
  eventQueue.push({ metric_name, metric_value, metadata });

  // תשלח את כל הנתונים אחרי 10 שניות או כשיש יותר מ-5 אירועים
  if (eventQueue.length >= 5) {
    flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushEvents();
    }, 10000);
  }
}

async function flushEvents() {
  if (eventQueue.length === 0) return;

  const payload = eventQueue.splice(0, eventQueue.length); // נשלח הכל
  flushTimeout && clearTimeout(flushTimeout);
  flushTimeout = null;

  const user_id = (await supabase.auth.getUser()).data?.user?.id;

  const enriched = payload.map(e => ({
    user_id,
    metric_name: e.metric_name,
    metric_value: e.metric_value,
    metadata: e.metadata,
  }));

  await supabase.from('analytics').insert(enriched);
}
