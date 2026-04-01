import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function NavigationItem({ item, isActive, accentColor = '#00C9B1' }) {
  const Icon = item.icon;

  return (
    <Link
      to={createPageUrl(item.path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '8px 12px',
        borderRadius: '8px',
        margin: '1px 6px',
        cursor: 'pointer',
        color: isActive ? '#00C9B1' : 'rgba(176,196,222,0.6)',
        fontSize: '12px',
        fontWeight: isActive ? 500 : 400,
        textDecoration: 'none',
        transition: 'all 0.15s',
        position: 'relative',
        background: isActive ? 'rgba(0,201,177,0.12)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = '#F0F4FF';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(176,196,222,0.6)';
        }
      }}
    >
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: '-6px',
            top: '4px',
            bottom: '4px',
            width: '3px',
            borderRadius: '0 3px 3px 0',
            background: accentColor,
          }}
        />
      )}
      <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
      <span>{item.label}</span>
      {item.badge && (
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '10px',
          background: item.badgeColor === 'warn' ? 'rgba(245,166,35,0.15)' : 'rgba(0,201,177,0.15)',
          color: item.badgeColor === 'warn' ? '#F5A623' : '#00C9B1',
        }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}
