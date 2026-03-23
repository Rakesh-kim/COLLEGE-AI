import { useEffect, useState } from 'react';
import { studentAPI } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { RiUser3Line, RiBookOpenLine, RiPhoneLine, RiMapPin2Line, RiHeartPulseLine, RiHome5Line } from 'react-icons/ri';

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-sm font-medium ${value ? 'text-white' : 'text-slate-600 italic'}`}>{value || 'Not provided'}</p>
  </div>
);

const Section = ({ icon, title, children }) => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-2">
      <span className="text-primary-400 text-lg">{icon}</span>
      <p className="font-semibold text-white text-sm">{title}</p>
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
  </div>
);

const ROOM_LABELS = { single: '🛏️ Single', double: '🛏🛏 Double', triple: '🛏🛏🛏 Triple' };

export default function ProfilePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getProfile()
      .then((res) => setStudent(res.data.student))
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pct = student?.completionPercent ?? 0;
  const statusColor = {
    incomplete: 'text-slate-400', pending: 'text-amber-400',
    approved: 'text-emerald-400', rejected: 'text-red-400',
  }[student?.registrationStatus] || 'text-slate-400';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{user?.name}</h1>
          <p className="text-sm text-slate-400 truncate">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`badge badge-${student?.registrationStatus}`}>
              {student?.registrationStatus?.charAt(0).toUpperCase() + student?.registrationStatus?.slice(1)}
            </span>
            {student?.roomNumber && (
              <span className="text-xs text-slate-400">Room: <span className="text-white font-medium">{student.roomNumber}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="section-label">Registration Completion</p>
          <span className="text-sm font-bold gradient-text">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {student?.completionFlags && Object.entries(student.completionFlags).map(([key, done]) => (
            <div key={key} className={`text-xs px-2.5 py-2 rounded-lg text-center border ${done ? 'border-emerald-600/40 text-emerald-400 bg-emerald-900/20' : 'border-white/5 text-slate-500 bg-white/5'}`}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          ))}
        </div>
      </div>

      {/* Admin note if rejected */}
      {student?.registrationStatus === 'rejected' && student?.adminNote && (
        <div className="glass-card p-4 border border-red-800/40 bg-red-900/10">
          <p className="text-xs text-red-400 font-semibold mb-1">Admin Note</p>
          <p className="text-sm text-red-300">{student.adminNote}</p>
        </div>
      )}

      {/* Profile sections */}
      <Section icon={<RiUser3Line />} title="Personal Information">
        <Field label="Phone" value={student?.phone} />
        <Field label="Blood Group" value={student?.bloodGroup} />
        <Field label="Emergency Contact" value={student?.emergencyContact} />
        <Field label="Parent's Phone" value={student?.parentPhone} />
      </Section>

      <Section icon={<RiBookOpenLine />} title="Academic Information">
        <Field label="Roll Number" value={student?.rollNo} />
        <Field label="Course" value={student?.course} />
        <Field label="Year" value={student?.year ? `Year ${student.year}` : null} />
        <Field label="Branch" value={student?.branch} />
      </Section>

      <Section icon={<RiHome5Line />} title="Hostel Preferences">
        <Field label="Room Preference" value={ROOM_LABELS[student?.roomPreference]} />
        <Field label="Room Number" value={student?.roomNumber} />
      </Section>

      <Section icon={<RiMapPin2Line />} title="Address">
        <div className="col-span-2"><Field label="Home Address" value={student?.address} /></div>
      </Section>
    </div>
  );
}
