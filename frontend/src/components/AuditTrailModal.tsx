import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { auditService } from '../services/api';
import type { AuditRecord } from '../types/tms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.list(1, 50);
      setLogs(data.records);
    } catch (err) {
      console.error('Failed loading audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Audit Trail — User Modifications Log</span>
            <button className="btn-secondary" onClick={loadLogs} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <button className="action-menu-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <div className="tms-table-wrapper">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Hub User</th>
                  <th>Action</th>
                  <th>Target TMS User</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                      {loading ? 'Loading logs...' : 'No audit trail records found yet.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.hub_user_email}</div>
                        <span className="product-tag" style={{ fontSize: '0.65rem' }}>{log.hub_user_role}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{log.action_type}</td>
                      <td>{log.target_tms_user_email || log.target_tms_user_id || '-'}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }} title={log.details}>
                        {log.details}
                      </td>
                      <td>
                        {log.status === 'SUCCESS' ? (
                          <span className="status-pill active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> SUCCESS
                          </span>
                        ) : (
                          <span className="status-pill inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> FAILURE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
