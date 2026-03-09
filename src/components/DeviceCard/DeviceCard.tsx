'use client';

import React from 'react';
import {
    Lightbulb,
    Thermometer,
    Lock,
    Unlock,
    Blinds,
    Fan,
    Tv,
    Gauge,
    Power,
    Star,
    Trash2,
} from 'lucide-react';
import { Device } from '@/types/device';
import { useDeviceStore } from '@/store/deviceStore';
import styles from './DeviceCard.module.css';

interface DeviceCardProps {
    device: Device;
    onClick?: () => void;
}

const deviceIcons: Record<string, React.ReactNode> = {
    light: <Lightbulb size={24} />,
    thermostat: <Thermometer size={24} />,
    lock: <Lock size={24} />,
    blind: <Blinds size={24} />,
    fan: <Fan size={24} />,
    media_player: <Tv size={24} />,
    sensor: <Gauge size={24} />,
    switch: <Power size={24} />,
};

export default function DeviceCard({ device, onClick }: DeviceCardProps) {
    const { setDeviceState, toggleFavorite, removeDevice, favoriteDeviceIds } = useDeviceStore();
    const isFavorite = favoriteDeviceIds.includes(device.id);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (device.type === 'light' || device.type === 'switch' || device.type === 'fan') {
            setDeviceState(device.id, { on: !device.state.on });
        } else if (device.type === 'lock') {
            setDeviceState(device.id, { locked: !device.state.locked });
        }
    };

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(device.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Remove "${device.name}"?`)) {
            removeDevice(device.id);
        }
    };

    const isOn = device.state.on !== undefined
        ? device.state.on
        : device.state.locked !== undefined
            ? device.state.locked
            : false;

    const getStatusColor = () => {
        if (device.status === 'offline') return 'var(--danger)';
        if (isOn) return 'var(--success)';
        return 'var(--text-muted)';
    };

    const getStateInfo = () => {
        switch (device.type) {
            case 'light':
                return device.state.on
                    ? `${device.state.brightness || 100}%`
                    : 'Off';
            case 'thermostat':
                return `${device.state.temperature}°C / ${device.state.targetTemperature}°C`;
            case 'lock':
                return device.state.locked ? 'Locked' : 'Unlocked';
            case 'sensor':
                return `${device.state.value} ${device.state.unit}`;
            case 'blind':
                return `${device.state.position}% open`;
            case 'fan':
                return device.state.on ? `Speed: ${device.state.speed}%` : 'Off';
            case 'media_player':
                return device.state.playing ? `Playing: ${device.state.source}` : device.state.source || 'Off';
            default:
                return isOn ? 'On' : 'Off';
        }
    };

    return (
        <div
            className={`${styles.card} ${isOn ? styles.active : ''}`}
            onClick={onClick}
        >
            <div className={styles.header}>
                <div
                    className={styles.icon}
                    style={{ color: getStatusColor() }}
                >
                    {device.state.locked === false ? <Unlock size={24} /> : deviceIcons[device.type]}
                </div>
                <div className={styles.actions}>
                    <button
                        className={`${styles.favoriteBtn} ${isFavorite ? styles.favorited : ''}`}
                        onClick={handleFavorite}
                        title="Favorite"
                    >
                        <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        className={styles.deleteBtn}
                        onClick={handleDelete}
                        title="Remove device"
                    >
                        <Trash2 size={16} />
                    </button>
                    <span className={`status-dot ${device.status}`} />
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.name}>{device.name}</h3>
                <p className={styles.state}>{getStateInfo()}</p>
            </div>

            {(device.type === 'light' || device.type === 'switch' || device.type === 'lock' || device.type === 'fan') && (
                <div className={styles.toggle}>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={isOn}
                            onChange={() => { }}
                            onClick={handleToggle}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            )}
        </div>
    );
}
