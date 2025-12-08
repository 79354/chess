import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, X } from 'lucide-react';
import api from '../../services/api';

function EditProfile({ onClose, onUpdate }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    country: user?.country || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      if (avatar) data.append('avatar', avatar);

      const response = await api.patch('/auth/profile/update/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onUpdate(response);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                {avatar ? (
                  <img src={URL.createObjectURL(avatar)} alt="Preview" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 rounded-full p-2 cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg py-3 font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;