import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import NavigationItem from './NavigationItem';

export default function SidebarLayout({
  homePath,
  logoContent,
  title,
  subtitle,
  navSections,
  helpPath,
  currentPage,
  accentColor = '#00C9B1',
  helpText = 'Ask Henry',
  onHelpClick,
}) {
  return (
    <div style={{
      width: '220px',
      background: '#0A1628',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      overflow: 'hidden',
    }}>
      {/* Logo Header */}
      <Link
        to={createPageUrl(homePath)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        {logoContent}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F4FF' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(176,196,222,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              {subtitle}
            </div>
          )}
        </div>
      </Link>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: '4px', overflowY: 'auto' }}>
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <div style={{
                padding: '18px 12px 4px',
                fontSize: '9px',
                fontWeight: 600,
                color: 'rgba(176,196,222,0.3)',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                isActive={currentPage === item.path}
                accentColor={accentColor}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Henry AI Card */}
      {(helpPath || onHelpClick) && (
        <div style={{ padding: '12px 8px', flexShrink: 0 }}>
          {onHelpClick ? (
            <button
              onClick={onHelpClick}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(0,201,177,0.12), rgba(30,136,229,0.08))',
                border: '1px solid rgba(0,201,177,0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #00C9B1, #00A693)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
                color: '#fff',
              }}>
                ✦
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#00C9B1' }}>AI Assistant</div>
                <div style={{ fontSize: '10px', color: 'rgba(176,196,222,0.5)' }}>{helpText}</div>
              </div>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'rgba(0,201,177,0.2)',
                border: '1px solid rgba(0,201,177,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: '#00C9B1',
                fontWeight: 700,
              }}>
                ?
              </div>
            </button>
          ) : (
            <Link to={createPageUrl(helpPath)} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,201,177,0.12), rgba(30,136,229,0.08))',
                border: '1px solid rgba(0,201,177,0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #00C9B1, #00A693)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                  color: '#fff',
                }}>
                  ✦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#00C9B1' }}>AI Assistant</div>
                  <div style={{ fontSize: '10px', color: 'rgba(176,196,222,0.5)' }}>{helpText}</div>
                </div>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(0,201,177,0.2)',
                  border: '1px solid rgba(0,201,177,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: '#00C9B1',
                  fontWeight: 700,
                }}>
                  ?
                </div>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
