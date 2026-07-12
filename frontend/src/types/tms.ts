export interface IdentityGroup {
  salutation?: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  reporting_manager: string;
}

export interface OrganizationGroup {
  company: string;
  business_unit: string;
  department: string;
  cost_center: string;
  location: string;
}

export interface AccessGroup {
  products_assigned: string[];
  roles: string[];
  account_status: string;
}

export interface PreferencesGroup {
  locale: string;
  currency: string;
  timezone: string;
  date_format: string;
  number_format: string;
}

export interface UserLevelLimitsGroup {
  max_purchase_limit?: number;
  approval_limit?: number;
}

export interface TMSUser {
  id: string;
  identity: IdentityGroup;
  organization: OrganizationGroup;
  access: AccessGroup;
  preferences: PreferencesGroup;
  limits: UserLevelLimitsGroup;
  status: string;
  last_login: string;
  travel_policy: boolean;
}

export interface PaginatedTMSUsers {
  records: TMSUser[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface HubUser {
  id: number;
  email: string;
  name: string;
  role: 'viewer' | 'user_manager' | 'admin';
  is_active: boolean;
}

export interface AuditRecord {
  id: number;
  timestamp: string;
  hub_user_email: string;
  hub_user_role: string;
  action_type: string;
  target_tms_user_id?: string;
  target_tms_user_email?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE';
}
