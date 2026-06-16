import { useState, useRef } from 'react';
import { User, Mail, Shield, Bell, Globe, Camera, Save, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

export default function ProfileSettings() {
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState<string | null>(profile.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
  });

  const handleSaveProfile = () => {
    updateProfile({ name: formData.name, email: formData.email, avatar: profileImage });
    showToast('Profile updated successfully!', 'success');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        showToast('Profile image updated!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'preferences', label: t('settings.preferences'), icon: Globe },
  ];

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUpdateSecurity = () => {
    const newErrors: Record<string, string> = {};
    if (!securityData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!securityData.newPassword) newErrors.newPassword = 'New password is required';
    else if (securityData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      showToast('Password updated successfully!', 'success');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast('Please fix the errors below', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                  : 'text-muted hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: activeTab === tab.id ? 'var(--primary-400)' : 'var(--text-muted)' }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass-card p-6 min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                <div className="relative group">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-xl" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                      {profile.initials}
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-surface-800 border border-white/10 text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Profile Picture</h3>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" 
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Upload
                    </button>
                    {profileImage && (
                      <button 
                        onClick={() => {
                          setProfileImage(null);
                          showToast('Profile image removed', 'info');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>{t('settings.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input border border-white/5 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>{t('settings.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input border border-white/5 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>{t('settings.bio')}</label>
                  <textarea 
                    rows={3} 
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 rounded-xl theme-input border border-white/5 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {t('settings.save')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lock className="w-5 h-5 text-primary-400" /> Password Management
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Current Password</label>
                  <input 
                    type="password" 
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    placeholder="••••••••" 
                    className={`w-full px-4 py-2.5 rounded-xl theme-input border text-sm transition-all ${errors.currentPassword ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5'}`} 
                  />
                  {errors.currentPassword && <p className="text-[10px] text-rose-500 px-1">{errors.currentPassword}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>New Password</label>
                    <input 
                      type="password" 
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      placeholder="••••••••" 
                      className={`w-full px-4 py-2.5 rounded-xl theme-input border text-sm transition-all ${errors.newPassword ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5'}`} 
                    />
                    {errors.newPassword && <p className="text-[10px] text-rose-500 px-1">{errors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      placeholder="••••••••" 
                      className={`w-full px-4 py-2.5 rounded-xl theme-input border text-sm transition-all ${errors.confirmPassword ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5'}`} 
                    />
                    {errors.confirmPassword && <p className="text-[10px] text-rose-500 px-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10">
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h4>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold cursor-pointer hover:bg-primary-600 transition-colors">Enable</button>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={handleUpdateSecurity}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Update Security
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive daily performance summaries via email.' },
                  { title: 'Push Notifications', desc: 'Get real-time alerts for task deadlines and mentions.' },
                  { title: 'System Alerts', desc: 'Critical system and security updates.' },
                  { title: 'Weekly Reports', desc: 'A curated summary of your team\'s weekly performance.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <div className="relative inline-block w-10 h-6">
                      <input type="checkbox" defaultChecked className="peer sr-only" id={`notif-${idx}`} />
                      <label htmlFor={`notif-${idx}`} className="block h-6 rounded-full bg-surface-700 cursor-pointer transition-colors peer-checked:bg-primary-500"></label>
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:left-5"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => showToast('Notification preferences updated!', 'success')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {t('settings.save')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings.preferences')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>{t('settings.language')}</label>
                  <select 
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value as any);
                      showToast(`Language changed to ${e.target.value}`, 'info');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl theme-select border border-white/5 text-sm cursor-pointer"
                  >
                    <option value="English (India)">English (India)</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>{t('settings.timezone')}</label>
                  <select className="w-full px-4 py-2.5 rounded-xl theme-select border border-white/5 text-sm cursor-pointer">
                    <option>GMT+05:30 (IST)</option>
                    <option>GMT+00:00 (UTC)</option>
                    <option>GMT-05:00 (EST)</option>
                  </select>
                </div>
              </div>

              <div className="pt-10 flex justify-end">
                <button 
                  onClick={() => showToast('Preferences updated successfully!', 'success')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {t('settings.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
