import type { SupabaseClient } from '@supabase/supabase-js';

type NotificationPayload = {
  title: string;
  message: string;
};

export async function notifyApprovedMembers(
  supabase: SupabaseClient,
  notification: NotificationPayload
) {
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('user_id')
    .or('approval_status.eq.approved,is_active.eq.true')
    .not('user_id', 'is', null);

  if (membersError) {
    console.error('Unable to load members for product notification:', membersError.message);
    return;
  }

  const rows = (members || [])
    .map((member) => member.user_id)
    .filter(Boolean)
    .map((userId) => ({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      is_read: false,
    }));

  if (rows.length === 0) return;

  const { error: notificationError } = await supabase.from('notifications').insert(rows);
  if (notificationError) {
    console.error('Unable to create product notifications:', notificationError.message);
  }
}
