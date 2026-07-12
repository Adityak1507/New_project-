import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { tmsUserService, orgService } from '../services/api';
import { AutocompleteField } from './AutocompleteField';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [reportingManager, setReportingManager] = useState('nova.admin@zycus.com');

  // Org Cascading State
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['Dashboard', 'AppXtend']);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Procurement Specialist']);

  // Preferences State
  const [locale, setLocale] = useState('en_US');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/dd/yyyy');
  const [numberFormat, setNumberFormat] = useState('#,###,###.##');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      loadInitialOptions();
    }
  }, [isOpen]);

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
      if (comps.length > 0 && !company) {
        setCompany(comps[0]);
      }
    } catch (err) {
      console.error('Failed loading options', err);
    }
  };

  // Cascade 1: Company -> BU
  useEffect(() => {
    if (company) {
      orgService.getBusinessUnits(company).then((bus) => {
        setBusinessUnits(bus);
        if (bus.length > 0) setBusinessUnit(bus[0]);
        else setBusinessUnit('');
      });
    }
  }, [company]);

  // Cascade 2: BU -> Department
  useEffect(() => {
    if (company && businessUnit) {
      orgService.getDepartments(company, businessUnit).then((depts) => {
        setDepartments(depts);
        if (depts.length > 0) setDepartment(depts[0]);
        else setDepartment('');
      });
    }
  }, [company, businessUnit]);

  // Cascade 3: Department -> Cost Center
  useEffect(() => {
    if (company && businessUnit && department) {
      orgService.getCostCenters(company, businessUnit, department).then((ccs) => {
        setCostCenters(ccs);
        if (ccs.length > 0) setCostCenter(ccs[0]);
        else setCostCenter('');
      });
    }
  }, [company, businessUnit, department]);

  // Cascade 4: Cost Center -> Location
  useEffect(() => {
    if (company && businessUnit && department && costCenter) {
      orgService.getLocations(company, businessUnit, department, costCenter).then((locs) => {
        setLocations(locs);
        if (locs.length > 0) setLocation(locs[0]);
        else setLocation('');
      });
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
    setError(null);
    if (!displayName || !email) {
      setError('Display Name and Email are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        identity: {
          salutation: 'Mr.',
          display_name: displayName,
          first_name: firstName || displayName.split(' ')[0] || displayName,
          last_name: lastName || displayName.split(' ').slice(1).join(' ') || '',
          email,
          designation: designation || 'Procurement Specialist',
          reporting_manager: reportingManager
        },
        organization: {
          company: company || 'Nova',
          business_unit: businessUnit || 'DEFAULT',
          department: department || 'Engineering',
          cost_center: costCenter || 'CC-ENG-101',
          location: location || 'Mumbai (HQ)'
        },
        access: {
          products_assigned: selectedProducts,
          roles: selectedRoles,
          account_status: 'Unlocked'
        },
        preferences: {
          locale,
          currency,
          timezone,
          date_format: dateFormat,
          number_format: numberFormat
        }
      };

      await tmsUserService.create(payload);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.detail || err.message || 'Failed to create user.';
      setError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">+ Add New TMS User</div>
          <button className="action-menu-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identity */}
          <div className="form-section-title">1. Identity & Contact Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Display Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Aditya Kumar"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. aditya.k@zycus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="form-grid-2">
            <AutocompleteField
              label="Designation / Job Title"
              value={designation}
              onChange={setDesignation}
              placeholder="e.g. Senior Procurement Specialist"
              fetchSuggestions={async (q) => {
                const results = await orgService.getDesignationSuggestions(q);
                return results.map(item => ({ label: item, value: item }));
              }}
            />
            <AutocompleteField
              label="Reporting Manager Email"
              value={reportingManager}
              onChange={setReportingManager}
              placeholder="Type name or email for suggestions..."
              fetchSuggestions={async (q) => {
                const results = await orgService.getReportingManagerSuggestions(q);
                return results.map(item => ({ label: item.label, value: item.email }));
              }}
            />
          </div>

          {/* Section 2: Organization (Cascading) */}
          <div className="form-section-title">2. Organization Hierarchy (Cascading)</div>
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

          {/* Section 3: Access & Products */}
          <div className="form-section-title">3. Products Assigned & Roles</div>
          <div className="form-group">
            <label className="form-label">Assigned Dewdrops Products ({selectedProducts.length} selected)</label>
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
            <label className="form-label">Roles ({selectedRoles.length} selected)</label>
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

          {/* Section 4: Preferences */}
          <div className="form-section-title">4. Preferences & Localization</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Locale</label>
              <select className="form-select" value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en_US">English (US)</option>
                <option value="en_GB">English (UK)</option>
                <option value="fr_FR">French (France)</option>
                <option value="de_DE">German (Germany)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">American Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="UTC">UTC - (GMT+00:00)</option>
                <option value="America/New_York">America/New_York - (GMT-4:00)</option>
                <option value="Asia/Kolkata">Asia/Kolkata - (GMT+00:00)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Number Format</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="form-select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                  <option value="yyyy/MM/dd">yyyy/MM/dd</option>
                </select>
                <select className="form-select" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)}>
                  <option value="#,###,###.##">#,###,###.##</option>
                  <option value="#.###.###,##">#.###.###,##</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '+ Create TMS User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
