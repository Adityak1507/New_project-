import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { tmsUserService, orgService } from '../services/api';
import type { TMSUser } from '../types/tms';
import { AutocompleteField } from './AutocompleteField';

interface Props {
  user: TMSUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<Props> = ({ user, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [status, setStatus] = useState('Active');

  // Org State
  const [companies, setCompanies] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);
  const [businessUnit, setBusinessUnit] = useState('');
  const [, setDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState('');
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [costCenter, setCostCenter] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  // Access State
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      setError(null);
      setDisplayName(user.identity.display_name);
      setFirstName(user.identity.first_name);
      setLastName(user.identity.last_name);
      setDesignation(user.identity.designation);
      setReportingManager(user.identity.reporting_manager);
      setStatus(user.status);

      setCompany(user.organization.company);
      setBusinessUnit(user.organization.business_unit);
      setDepartment(user.organization.department);
      setCostCenter(user.organization.cost_center);
      setLocation(user.organization.location);

      setSelectedProducts(user.access.products_assigned || []);
      setSelectedRoles(user.access.roles || []);

      loadInitialOptions();
    }
  }, [isOpen, user]);

  const loadInitialOptions = async () => {
    try {
      const [comps, prods, roles] = await Promise.all([
        orgService.getCompanies(),
        tmsUserService.getAvailableProducts(),
        tmsUserService.getAvailableRoles()
      ]);
      setCompanies(comps);
      setAvailableProducts(prods);
      setAvailableRoles(roles);
    } catch (err) {
      console.error('Failed options load', err);
    }
  };

  useEffect(() => {
    if (company) {
      orgService.getBusinessUnits(company).then(setBusinessUnits);
    }
  }, [company]);

  useEffect(() => {
    if (company && businessUnit) {
      orgService.getDepartments(company, businessUnit).then(setDepartments);
    }
  }, [company, businessUnit]);

  useEffect(() => {
    if (company && businessUnit && department) {
      orgService.getCostCenters(company, businessUnit, department).then(setCostCenters);
    }
  }, [company, businessUnit, department]);

  useEffect(() => {
    if (company && businessUnit && department && costCenter) {
      orgService.getLocations(company, businessUnit, department, costCenter).then(setLocations);
    }
  }, [company, businessUnit, department, costCenter]);

  const handleProductToggle = (prod: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]
    );
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        status,
        identity: {
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          designation,
          reporting_manager: reportingManager
        },
        organization: {
          company,
          business_unit: businessUnit,
          department,
          cost_center: costCenter,
          location
        },
        access: {
          products_assigned: selectedProducts,
          roles: selectedRoles
        }
      };

      await tmsUserService.update(user.id, payload);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.detail || err.message || 'Failed to update user.';
      setError(msg);
    }
  };

  if (!isOpen || !user) return null;

  const isProtectedAdmin = user.identity.email.toLowerCase() === 'nova.admin@zycus.com';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">Edit User — {user.identity.email}</div>
          <button className="action-menu-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {isProtectedAdmin && (
            <div className="alert-box alert-info">
              <AlertCircle size={18} />
              <span>Note: Company Admin status cannot be deactivated (Rule 3 protected).</span>
            </div>
          )}

          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-section-title">1. Identity & Profile</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isProtectedAdmin}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <AutocompleteField
              label="Designation (Suggestions from API)"
              value={designation}
              onChange={setDesignation}
              placeholder="e.g. Senior Procurement Specialist"
              fetchSuggestions={async (q) => {
                const results = await orgService.getDesignationSuggestions(q);
                return results.map(item => ({ label: item, value: item }));
              }}
            />
            <AutocompleteField
              label="Reporting Manager (Search User API)"
              value={reportingManager}
              onChange={setReportingManager}
              placeholder="Type name or email..."
              fetchSuggestions={async (q) => {
                const results = await orgService.getReportingManagerSuggestions(q);
                return results.map(item => ({ label: item.label, value: item.email }));
              }}
            />
          </div>

          <div className="form-section-title">2. Organization Hierarchy</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Company</label>
              <select className="form-select" value={company} onChange={(e) => setCompany(e.target.value)}>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Business Unit</label>
              <select className="form-select" value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)}>
                {businessUnits.map((bu) => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <AutocompleteField
              label="Department (Suggestions from API)"
              value={department}
              onChange={setDepartment}
              placeholder="Type to search department..."
              fetchSuggestions={async (q) => {
                const results = await orgService.getDepartmentSuggestions(q);
                return results.map(item => ({ label: item, value: item }));
              }}
            />
            <div className="form-group">
              <label className="form-label">Cost Center</label>
              <select className="form-select" value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                {costCenters.map((cc) => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location / Facility</label>
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-section-title">3. Products Assigned & Roles</div>
          <div className="form-group">
            <label className="form-label">Assigned Dewdrops Products</label>
            <div className="checkbox-group" style={{ maxHeight: '160px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
              {availableProducts.map((prod) => {
                const isSel = selectedProducts.includes(prod);
                return (
                  <label key={prod} className={`checkbox-label ${isSel ? 'selected' : ''}`} onClick={() => handleProductToggle(prod)}>
                    <input type="checkbox" checked={isSel} readOnly style={{ display: 'none' }} />
                    {prod}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned Roles</label>
            <div className="checkbox-group" style={{ maxHeight: '120px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
              {availableRoles.map((role) => {
                const isSel = selectedRoles.includes(role);
                return (
                  <label key={role} className={`checkbox-label ${isSel ? 'selected' : ''}`} onClick={() => handleRoleToggle(role)}>
                    <input type="checkbox" checked={isSel} readOnly style={{ display: 'none' }} />
                    {role}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
