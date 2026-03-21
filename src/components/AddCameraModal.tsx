'use client';

import { useState } from 'react';
import { useCameraStore } from '@/store/cameraStore';
import { validateCameraConfig } from '@/lib/tapo-stream';
import { X, Camera, Wifi, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './AddCameraModal.module.css';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  name: '',
  ip: '',
  username: '',
  password: '',
  stream: 'stream1' as 'stream1' | 'stream2',
  onDemand: false,
};

export default function AddCameraModal({ isOpen, onClose }: AddCameraModalProps) {
  const { addCamera } = useCameraStore();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [testOk, setTestOk] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const set = (key: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError(null);
    setTestOk(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const camera = { id: `camera_${Date.now()}`, ...formData };

    if (!validateCameraConfig(camera)) {
      setError('Check all fields: name, valid IP, username, and password are required.');
      return;
    }

    try {
      await addCamera(camera);
      setFormData(EMPTY_FORM);
      setTestOk(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save camera.');
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setError(null);
    setTestOk(false);

    try {
      await fetch('/api/relay/start', { method: 'POST' }).catch(() => {});

      const res = await fetch('/api/camera/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraIp: formData.ip,
          username: formData.username,
          password: formData.password,
          stream: formData.stream,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = String(data.error || 'Connection failed.');
        if (message.toLowerCase().includes('ffmpeg') || message.toLowerCase().includes('relay')) {
          throw new Error('We could not verify the video automatically right now. You can still save the camera and try opening it.');
        }
        throw new Error(message);
      }

      setTestOk(true);
    } catch (e: any) {
      setError(e.message || 'Connection failed. Check the IP, username, and password.');
    } finally {
      setIsTesting(false);
    }
  };

  const canTest = !isTesting && !!formData.ip && !!formData.username && !!formData.password;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <Camera size={22} />
            </div>
            <div>
              <div className={styles.title}>Add Tapo Camera</div>
              <div className={styles.subtitle}>Add your camera details to start live view</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-name">Camera Name</label>
            <input
              id="cam-name"
              className={styles.input}
              type="text"
              value={formData.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Front Door"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-ip">Camera IP Address</label>
            <input
              id="cam-ip"
              className={styles.input}
              type="text"
              value={formData.ip}
              onChange={e => set('ip', e.target.value)}
              placeholder="192.168.1.100"
              required
            />
            <span className={styles.hint}>Find it in the Tapo app or your router device list</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-user">Camera Username</label>
            <input
              id="cam-user"
              className={styles.input}
              type="text"
              value={formData.username}
              onChange={e => set('username', e.target.value)}
              placeholder="Camera username"
              required
            />
            <span className={styles.hint}>Use the username you created for this camera in the Tapo app</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-pass">Camera Password</label>
            <input
              id="cam-pass"
              className={styles.input}
              type="password"
              value={formData.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Camera password"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-stream">Stream Quality</label>
            <select
              id="cam-stream"
              className={styles.select}
              value={formData.stream}
              onChange={e => set('stream', e.target.value)}
            >
              <option value="stream1">High Quality (1080p)</option>
              <option value="stream2">Lower Quality (faster)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cam-ondemand">
              <input
                id="cam-ondemand"
                type="checkbox"
                checked={formData.onDemand}
                onChange={e => set('onDemand', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Start only when the camera is active
            </label>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {testOk && (
            <div className={styles.success}>
              <CheckCircle size={15} />
              Camera connection looks good.
            </div>
          )}
        </form>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.testBtn}
            onClick={handleTest}
            disabled={!canTest}
          >
            <Wifi size={15} />
            {isTesting ? 'Checking...' : 'Test'}
          </button>
          <button type="submit" className={styles.submitBtn} onClick={handleSubmit}>
            <Plus size={16} />
            Add Camera
          </button>
        </div>
      </div>
    </div>
  );
}
