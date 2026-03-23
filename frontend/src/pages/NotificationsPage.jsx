import { useEffect, useState } from 'react';
import { studentAPI } from '../api/apiService';
import { toast } from 'react-toastify';
import { RiBellLine, RiCheckDoubleLine } from 'react-icons/ri';

const TYPE_STYLES = {
  info:     'bg-blue-900/20 border-blue-800/40 text-blue-300',
  success:  'bg-emerald-900/20 border-emerald-800/40 text-emerald-300',
  warning:  'bg-amber-900/20 border-amber-800/40 text-amber-300',
  deadline: 'bg-red-900/20 border-red-800/40 text-red-300',
  approval: 'bg-purple-900/20 border-purple-800/40 text-purple-300',
};

const TYPE_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', deadline: '⏰', approval: '🎉' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await studentAPI.getNotifications();
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch { toast.error('Could not load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    try {
      await studentAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.read);
    await Promise.all(unreadOnes.map((n) => studentAPI.markRead(n._id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    toast.success('All notifications marked as read.');
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-600 text-white">
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors">
            <RiCheckDoubleLine /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <RiBellLine className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No notifications yet</p>
          <p className="text-slate-600 text-sm mt-1">You'll receive updates about your registration here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`glass-card p-4 flex gap-4 cursor-pointer transition-all duration-200 border
                ${n.read ? 'opacity-60 border-white/5' : `border ${TYPE_STYLES[n.type] || TYPE_STYLES.info}`}
                hover:opacity-100`}
            >
              <span className="text-2xl shrink-0">{TYPE_ICONS[n.type] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />}
                </div>
                <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {new Date(n.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
