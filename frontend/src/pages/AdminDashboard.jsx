import { useEffect, useState } from 'react';
import { adminAPI } from '../api/apiService';
import { toast } from 'react-toastify';
import {
  RiGroupLine, RiTimeLine, RiCheckLine, RiCloseLine,
  RiSearchLine, RiSendPlane2Line, RiUser3Line
} from 'react-icons/ri';

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  </div>
);

const StatusModal = ({ student, onClose, onUpdate }) => {
  const [status, setStatus] = useState(student.registrationStatus);
  const [note, setNote] = useState(student.adminNote || '');
  const [room, setRoom] = useState(student.roomNumber || '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onUpdate(student._id, { status, adminNote: note, roomNumber: room });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-md space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Update Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl"><RiCloseLine /></button>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Student</p>
          <p className="text-sm font-medium text-white">{student.userId?.name} — {student.userId?.email}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="section-label mb-1 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-full">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {status === 'approved' && (
            <div>
              <label className="section-label mb-1 block">Room Number</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-204" className="input-field w-full" />
            </div>
          )}
          {status === 'rejected' && (
            <div>
              <label className="section-label mb-1 block">Rejection Reason</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Explain why…" rows={3} className="input-field w-full resize-none" />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getStudents({ status: filterStatus, search }),
      ]);
      setStats(statsRes.data.stats);
      setStudents(studentsRes.data.students);
    } catch { toast.error('Could not load dashboard data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus, search]);

  const handleUpdate = async (id, data) => {
    try {
      await adminAPI.updateStatus(id, data);
      toast.success('Status updated successfully!');
      fetchData();
    } catch { toast.error('Update failed.'); }
  };

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return toast.error('Fill in title and message.');
    setSending(true);
    try {
      const res = await adminAPI.sendNotification(notifForm);
      toast.success(res.data.message);
      setNotifForm({ title: '', message: '', type: 'info' });
    } catch { toast.error('Failed to send notification.'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Manage student registrations and send notifications</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon="👥" label="Total Students" value={stats.total} color="bg-primary-600/20 text-primary-400" />
          <StatCard icon="⏳" label="Pending" value={stats.pending} color="bg-amber-900/30 text-amber-400" />
          <StatCard icon="✅" label="Approved" value={stats.approved} color="bg-emerald-900/30 text-emerald-400" />
          <StatCard icon="❌" label="Rejected" value={stats.rejected} color="bg-red-900/30 text-red-400" />
        </div>
      )}

      {/* Students Table + Notify Panel */}
      <div className="flex gap-4 flex-col xl:flex-row">
        {/* Students */}
        <div className="flex-1 glass-card p-5 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <p className="font-semibold text-white flex-1">Students</p>
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…" className="input-field pl-9 text-sm w-48" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-sm w-36">
              <option value="">All Status</option>
              <option value="incomplete">Incomplete</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  <th className="pb-3 text-xs text-slate-400 font-medium">Student</th>
                  <th className="pb-3 text-xs text-slate-400 font-medium">Course</th>
                  <th className="pb-3 text-xs text-slate-400 font-medium">Status</th>
                  <th className="pb-3 text-xs text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500 text-sm">No students found</td></tr>
                ) : students.map((s) => (
                  <tr key={s._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                          {s.userId?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[130px]">{s.userId?.name || '—'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[130px]">{s.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{s.course || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge badge-${s.registrationStatus}`}>
                        {s.registrationStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => setSelected(s)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-primary-600/40 text-primary-400 hover:bg-primary-600/20 transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Broadcast Notification Panel */}
        <div className="xl:w-80 glass-card p-5 space-y-4 shrink-0">
          <p className="font-semibold text-white">📣 Send Notification</p>
          <form onSubmit={handleNotify} className="space-y-3">
            <div>
              <label className="section-label mb-1 block">Type</label>
              <select value={notifForm.type} onChange={(e) => setNotifForm((f) => ({ ...f, type: e.target.value }))} className="input-field w-full text-sm">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="deadline">Deadline</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div>
              <label className="section-label mb-1 block">Title</label>
              <input value={notifForm.title} onChange={(e) => setNotifForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notification title" className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="section-label mb-1 block">Message</label>
              <textarea value={notifForm.message} onChange={(e) => setNotifForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Broadcast message to all students…" rows={4} className="input-field w-full text-sm resize-none" />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
              <RiSendPlane2Line /> {sending ? 'Sending…' : 'Broadcast to All'}
            </button>
          </form>
        </div>
      </div>

      {/* Status Update Modal */}
      {selected && (
        <StatusModal
          student={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
