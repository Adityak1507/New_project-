import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, MoreVertical, X, Edit3, CheckCircle, 
  XCircle, Shield, History, ChevronDown, ChevronLeft, ChevronRight, UserCheck
} from 'lucide-react';
import { authService, tmsUserService } from './services/api';
import type { TMSUser, HubUser } from './types/tms';
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import { AuditTrailModal } from './components/AuditTrailModal';

export const App: React.FC = () => {
  const [currentHubUser, setCurrentHubUser] = useState<HubUser | null>(null);
  const [records, setRecords] = useState<TMSUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [buFilter, setBuFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TMSUser | null>(null);
  const [viewingUser, setViewingUser] = useState<TMSUser | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Available options for filters
  const [allProducts, setAllProducts] = useState<string[]>([]);

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    if (currentHubUser) {
      loadUsers();
    }
  }, [currentHubUser, page, size, search, statusFilter, sortBy]);

  const initApp = async () => {
    try {
      await authService.seed();
      // Login as admin by default so all features are ready to experience immediately
      await switchHubRole('admin@hub.com');
      const prods = await tmsUserService.getAvailableProducts();
      setAllProducts(prods);
    } catch (err) {
      console.error('Initialization error', err);
    }
  };

  const switchHubRole = async (username: string) => {
    try {
      await authService.login(username, 'password123');
      const me = await authService.me();
      setCurrentHubUser(me);
      showToast('success', `Logged in as ${me.name} (${me.role.toUpperCase()})`);
    } catch (err) {
      console.error('Role switch error', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await tmsUserService.list(page, size, search, statusFilter, sortBy);
      setRecords(data.records);
      setTotalCount(data.total_count);
    } catch (err) {
      console.error('Failed loading users', err);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusChange = async (user: TMSUser, newActive: boolean) => {
    try {
      await tmsUserService.changeStatus(user.id, newActive);
      showToast('success', `User ${user.identity.email} status changed to ${newActive ? 'Active' : 'Inactive'}.`);
      loadUsers();
      setOpenMenuId(null);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed changing status.';
      showToast('error', msg);
      setOpenMenuId(null);
    }
  };

  const handleAddClick = () => {
    if (currentHubUser?.role === 'viewer') {
      showToast('error', 'Access Denied: Viewers do not have permission to create TMS Users.');
      return;
    }
    setIsCreateOpen(true);
  };

  // Client-side sub-filtering for exact UI column filters
  const filteredRecords = records.filter((r) => {
    if (companyFilter !== 'All' && r.organization.company !== companyFilter) return false;
    if (buFilter !== 'All' && r.organization.business_unit !== buFilter) return false;
    if (deptFilter !== 'All' && r.organization.department !== deptFilter) return false;
    if (productFilter !== 'All' && !r.access.products_assigned.includes(productFilter)) return false;
    return true;
  });

  const companiesList = Array.from(new Set(records.map(r => r.organization.company)));
  const buList = Array.from(new Set(records.map(r => r.organization.business_unit)));
  const deptList = Array.from(new Set(records.map(r => r.organization.department)));

  const totalPages = Math.ceil(totalCount / size) || 1;
  const startIdx = totalCount === 0 ? 0 : (page - 1) * size + 1;
  const endIdx = Math.min(page * size, totalCount);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Top Navbar */}
      <header className="hub-navbar">
        <a href="#" className="hub-logo">
          <Shield size={24} color="#3b82f6" />
          <span>ZYCUS DEWDROPS — TMS USER HUB</span>
          <span className="hub-logo-badge">Passwordless SSO Connected</span>
        </a>

        <div className="hub-nav-actions">
          {currentHubUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="#94a3b8" />
                <span>Hub Role:</span>
                <strong style={{ color: '#60a5fa' }}>{currentHubUser.name} ({currentHubUser.role.toUpperCase()})</strong>
              </div>

              {/* Role Switcher */}
              <select 
                className="pagination-select" 
                style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #334155' }}
                value={currentHubUser.email}
                onChange={(e) => switchHubRole(e.target.value)}
              >
                <option value="admin@hub.com">Switch to Admin</option>
                <option value="manager@hub.com">Switch to User Manager</option>
                <option value="viewer@hub.com">Switch to Viewer (Read-Only)</option>
              </select>
            </div>
          )}

          <button className="btn-secondary" onClick={() => setIsAuditOpen(true)} style={{ background: '#1e293b', color: '#ffffff', borderColor: '#334155' }}>
            <History size={15} />
            <span>Audit Trail</span>
          </button>
        </div>
      </header>

      {/* Notifications Toast */}
      {notification && (
        <div style={{ position: 'fixed', top: '76px', right: '24px', zIndex: 2000, minWidth: '320px', boxShadow: 'var(--shadow-lg)' }}
             className={`alert-box ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="hub-main">
        <div className="hub-card">
          {/* Controls Bar exact match */}
          <div className="tms-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="tms-title-dropdown">
                <span>Active Users ({totalCount})</span>
                <ChevronDown size={18} color="#64748b" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
              <div className="tms-search-container">
                <Search size={16} className="tms-search-icon" />
                <input
                  type="text"
                  className="tms-search-input"
                  placeholder="Search user by name, email or designation..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              <button className="btn-primary" onClick={handleAddClick}>
                <Plus size={16} />
                <span>Add user</span>
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="tms-table-wrapper" style={{ minHeight: '440px' }}>
            <table className="tms-table">
              <thead>
                <tr>
                  <th>
                    <div>Display Name</div>
                    <select className="tms-col-filter-select tms-col-filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="name_asc">Sort A-Z</option>
                      <option value="name_desc">Sort Z-A</option>
                    </select>
                  </th>
                  <th>Email Address</th>
                  <th>
                    <div>Company</div>
                    <select className="tms-col-filter-select tms-col-filter" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                      <option value="All">All Companies</option>
                      {companiesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </th>
                  <th>
                    <div>Business Unit</div>
                    <select className="tms-col-filter-select tms-col-filter" value={buFilter} onChange={(e) => setBuFilter(e.target.value)}>
                      <option value="All">All BUs</option>
                      {buList.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                    </select>
                  </th>
                  <th>
                    <div>Department</div>
                    <select className="tms-col-filter-select tms-col-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                      <option value="All">All Depts</option>
                      {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </th>
                  <th>Cost Center</th>
                  <th>
                    <div>Products Assigned</div>
                    <select className="tms-col-filter-select tms-col-filter" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                      <option value="All">All Products</option>
                      {allProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </th>
                  <th>
                    <div>Status</div>
                    <select className="tms-col-filter-select tms-col-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </th>
                  <th>Last login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No TMS users match the selected filters or search keyword.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isProtected = r.identity.email.toLowerCase() === 'nova.admin@zycus.com';
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.identity.display_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.identity.designation}</div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{r.identity.email}</td>
                        <td>{r.organization.company}</td>
                        <td>{r.organization.business_unit}</td>
                        <td>{r.organization.department}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.organization.cost_center}</span>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          {r.access.products_assigned.map(prod => (
                            <span key={prod} className="product-tag">{prod}</span>
                          ))}
                        </td>
                        <td>
                          <span className={`status-pill ${r.status.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                            <span className="status-dot"></span>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {r.last_login}
                        </td>
                        <td className="actions-cell" style={{ position: 'relative' }}>
                          <span className="action-link" onClick={() => setViewingUser(r)}>View</span>
                          <button className="action-menu-btn" onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}>
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === r.id && (
                            <div style={{
                              position: 'absolute', right: '16px', top: '38px', background: '#ffffff',
                              border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)',
                              zIndex: 100, minWidth: '150px', overflow: 'hidden'
                            }}>
                              <button
                                style={{
                                  width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                  fontSize: '0.8125rem'
                                }}
                                onClick={() => { setOpenMenuId(null); setEditingUser(r); }}
                              >
                                <Edit3 size={14} color="#3b82f6" />
                                <span>Edit User</span>
                              </button>

                              {r.status.toLowerCase() === 'active' ? (
                                <button
                                  style={{
                                    width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                                    cursor: isProtected ? 'not-allowed' : 'pointer', fontSize: '0.8125rem',
                                    color: isProtected ? '#cbd5e1' : '#ef4444', borderTop: '1px solid var(--border)'
                                  }}
                                  disabled={isProtected}
                                  title={isProtected ? 'Company Admin cannot be deactivated' : 'Deactivate User'}
                                  onClick={() => handleStatusChange(r, false)}
                                >
                                  <XCircle size={14} />
                                  <span>{isProtected ? 'Deactivate (Protected)' : 'Deactivate User'}</span>
                                </button>
                              ) : (
                                <button
                                  style={{
                                    width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontSize: '0.8125rem', color: '#10b981', borderTop: '1px solid var(--border)'
                                  }}
                                  onClick={() => handleStatusChange(r, true)}
                                >
                                  <CheckCircle size={14} />
                                  <span>Activate User</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar exact match */}
          <div className="tms-pagination-bar">
            <div className="pagination-select-group">
              <span>Show records</span>
              <select className="pagination-select" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div>
              Showing {startIdx} to {endIdx} of {totalCount} records
            </div>

            <div className="pagination-controls">
              <span style={{ marginRight: '6px' }}>Go to page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) setPage(val);
                }}
                style={{ width: '56px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
              />
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    className={`page-btn ${page === pNum ? 'active' : ''}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => { showToast('success', 'New TMS User created successfully!'); loadUsers(); }}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSuccess={() => { showToast('success', 'TMS User updated successfully!'); loadUsers(); }}
      />

      <AuditTrailModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* View User Detail Drawer / Modal */}
      {viewingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">User Details — {viewingUser.identity.display_name}</div>
              <button className="action-menu-btn" onClick={() => setViewingUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid-2">
                <div>
                  <div className="form-label">Email Address</div>
                  <div style={{ fontWeight: 600 }}>{viewingUser.identity.email}</div>
                </div>
                <div>
                  <div className="form-label">Designation</div>
                  <div>{viewingUser.identity.designation}</div>
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <div className="form-label">Company & BU</div>
                  <div>{viewingUser.organization.company} ({viewingUser.organization.business_unit})</div>
                </div>
                <div>
                  <div className="form-label">Department & Cost Center</div>
                  <div>{viewingUser.organization.department} — <strong style={{ fontFamily: 'monospace' }}>{viewingUser.organization.cost_center}</strong></div>
                </div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: '6px' }}>Assigned Products</div>
                <div>
                  {viewingUser.access.products_assigned.map(p => (
                    <span key={p} className="product-tag">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: '6px' }}>Roles</div>
                <div>
                  {viewingUser.access.roles.map(r => (
                    <span key={r} className="product-tag" style={{ background: '#f1f5f9', color: '#1e293b', borderColor: '#cbd5e1' }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingUser(null)}>Close</button>
              <button className="btn-primary" onClick={() => { const u = viewingUser; setViewingUser(null); setEditingUser(u); }}>
                <Edit3 size={15} /> Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
