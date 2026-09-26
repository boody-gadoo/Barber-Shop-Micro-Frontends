/**
 * Security Hardening & Compliance
 * Phase 8 Task 5: Security Hardening & Compliance
 * 
 * SOC 2 Type II, GDPR, Penetration Testing, WAF
 */

export interface ComplianceItem {
  name: string;
  category: 'SOC2' | 'GDPR' | 'OWASP' | 'General';
  status: 'completed' | 'in-progress' | 'pending';
  description: string;
  targetDate: Date;
  owner: string;
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedComponent: string;
  remediation: string;
  dueDate: Date;
  status: 'open' | 'in-progress' | 'resolved';
}

export interface DataProcessingRecord {
  dataType: string;
  purposeOfProcessing: string;
  storageLocation: string;
  retentionPeriod: string;
  dataProcessor: string[];
  legalBasis: string;
}

/**
 * Compliance Tracker: Manages SOC 2, GDPR, and Security compliance
 */
export class ComplianceTracker {
  private complianceItems: ComplianceItem[] = [];
  private findings: SecurityFinding[] = [];
  private dataProcessing: DataProcessingRecord[] = [];

  /**
   * SOC 2 Type II Compliance Framework (CC, A, C, PI, PE)
   */
  initializeSOC2Framework(): void {
    const soc2Items: ComplianceItem[] = [
      {
        name: 'Control Environment (CC)',
        category: 'SOC2',
        status: 'completed',
        description: 'IT governance, risk management, and oversight',
        targetDate: new Date('2027-03-31'),
        owner: 'Security Team',
      },
      {
        name: 'Communication & Information (A)',
        category: 'SOC2',
        status: 'in-progress',
        description: 'System monitoring, logging, and incident reporting',
        targetDate: new Date('2027-03-31'),
        owner: 'DevOps Team',
      },
      {
        name: 'Logical & Physical Access Control (A)',
        category: 'SOC2',
        status: 'in-progress',
        description: 'Access controls, authentication, and asset protection',
        targetDate: new Date('2027-03-31'),
        owner: 'Security Team',
      },
      {
        name: 'Availability (A)',
        category: 'SOC2',
        status: 'completed',
        description: 'System availability, disaster recovery, and business continuity',
        targetDate: new Date('2027-03-31'),
        owner: 'DevOps Team',
      },
      {
        name: 'Confidentiality (C)',
        category: 'SOC2',
        status: 'in-progress',
        description: 'Data encryption, access controls, and confidentiality policies',
        targetDate: new Date('2027-03-31'),
        owner: 'Security Team',
      },
      {
        name: 'Privacy (PI)',
        category: 'SOC2',
        status: 'pending',
        description: 'Personal data handling, consent, and privacy policies',
        targetDate: new Date('2027-03-31'),
        owner: 'Legal Team',
      },
      {
        name: 'Processing Integrity (PE)',
        category: 'SOC2',
        status: 'in-progress',
        description: 'Data validation, error handling, and completeness',
        targetDate: new Date('2027-03-31'),
        owner: 'QA Team',
      },
    ];

    this.complianceItems.push(...soc2Items);
  }

  /**
   * GDPR Compliance Setup
   */
  initializeGDPRCompliance(): void {
    const gdprItems: ComplianceItem[] = [
      {
        name: 'Privacy Policy',
        category: 'GDPR',
        status: 'completed',
        description: 'GDPR-compliant privacy policy published',
        targetDate: new Date('2026-12-31'),
        owner: 'Legal Team',
      },
      {
        name: 'Data Processing Agreement (DPA)',
        category: 'GDPR',
        status: 'completed',
        description: 'DPA in place with all data processors',
        targetDate: new Date('2026-12-31'),
        owner: 'Legal Team',
      },
      {
        name: 'Data Retention Policy',
        category: 'GDPR',
        status: 'in-progress',
        description: 'Automated data deletion after 12 months',
        targetDate: new Date('2026-11-30'),
        owner: 'DevOps Team',
      },
      {
        name: 'Right to Access (DSAR) Process',
        category: 'GDPR',
        status: 'pending',
        description: 'Implement Data Subject Access Request procedure',
        targetDate: new Date('2026-11-30'),
        owner: 'Product Team',
      },
      {
        name: 'Breach Notification Procedure',
        category: 'GDPR',
        status: 'completed',
        description: '72-hour breach notification process',
        targetDate: new Date('2026-10-31'),
        owner: 'Security Team',
      },
      {
        name: 'Consent Management',
        category: 'GDPR',
        status: 'in-progress',
        description: 'Explicit opt-in for marketing communications',
        targetDate: new Date('2026-11-30'),
        owner: 'Product Team',
      },
    ];

    this.complianceItems.push(...gdprItems);
  }

  /**
   * Register data processing activities
   */
  registerDataProcessing(): void {
    this.dataProcessing.push(
      {
        dataType: 'User Personal Data (name, email, phone)',
        purposeOfProcessing: 'Account creation and booking management',
        storageLocation: 'AWS RDS (us-east-1)',
        retentionPeriod: '12 months after last activity',
        dataProcessor: ['AWS', 'Stripe (payment)'],
        legalBasis: 'Contractual necessity',
      },
      {
        dataType: 'Booking History',
        purposeOfProcessing: 'Service history and analytics',
        storageLocation: 'AWS RDS + S3',
        retentionPeriod: '24 months',
        dataProcessor: ['AWS'],
        legalBasis: 'Legitimate interest',
      },
      {
        dataType: 'Analytics & Behavioral Data',
        purposeOfProcessing: 'Platform improvement and marketing',
        storageLocation: 'CloudWatch Logs + Segment',
        retentionPeriod: '90 days',
        dataProcessor: ['AWS', 'Segment'],
        legalBasis: 'Legitimate interest + Consent',
      },
      {
        dataType: 'IP Address & Device Info',
        purposeOfProcessing: 'Security and fraud prevention',
        storageLocation: 'AWS CloudFront + WAF logs',
        retentionPeriod: '30 days',
        dataProcessor: ['AWS'],
        legalBasis: 'Legitimate interest',
      }
    );
  }

  /**
   * Add security finding
   */
  addFinding(finding: SecurityFinding): void {
    this.findings.push(finding);
    console.log(`[Security] ${finding.severity.toUpperCase()}: ${finding.title}`);
  }

  /**
   * Log security finding from penetration test
   */
  logPenetrationTestFindings(): void {
    const findings: SecurityFinding[] = [
      {
        id: 'PT-001',
        severity: 'critical',
        title: 'SQL Injection vulnerability in booking search',
        description: 'User input not properly sanitized in booking search endpoint',
        affectedComponent: 'API - Booking Service',
        remediation: 'Implement parameterized queries and input validation',
        dueDate: new Date('2026-11-15'),
        status: 'open',
      },
      {
        id: 'PT-002',
        severity: 'high',
        title: 'Missing CSRF protection',
        description: 'CSRF tokens not validated on state-changing requests',
        affectedComponent: 'Web Application',
        remediation: 'Implement CSRF token middleware',
        dueDate: new Date('2026-11-20'),
        status: 'open',
      },
      {
        id: 'PT-003',
        severity: 'high',
        title: 'Weak password policy',
        description: 'Password minimum length only 6 characters',
        affectedComponent: 'Authentication',
        remediation: 'Enforce 12-character minimum with complexity requirements',
        dueDate: new Date('2026-11-15'),
        status: 'in-progress',
      },
      {
        id: 'PT-004',
        severity: 'medium',
        title: 'Missing security headers',
        description: 'CSP, HSTS, and X-Frame-Options headers not configured',
        affectedComponent: 'Web Server',
        remediation: 'Add security headers to all HTTP responses',
        dueDate: new Date('2026-11-10'),
        status: 'open',
      },
      {
        id: 'PT-005',
        severity: 'low',
        title: 'Outdated JavaScript libraries',
        description: 'jQuery 3.2.1 (unsupported) detected in dependencies',
        affectedComponent: 'Frontend',
        remediation: 'Upgrade to current version or remove dependency',
        dueDate: new Date('2026-12-01'),
        status: 'open',
      },
    ];

    findings.forEach((f) => this.addFinding(f));
  }

  /**
   * Get compliance summary
   */
  getComplianceSummary(): {
    totalItems: number;
    completed: number;
    inProgress: number;
    pending: number;
    compliancePercentage: number;
    soc2Status: string;
    gdprStatus: string;
  } {
    const completed = this.complianceItems.filter((i) => i.status === 'completed').length;
    const inProgress = this.complianceItems.filter((i) => i.status === 'in-progress').length;
    const pending = this.complianceItems.filter((i) => i.status === 'pending').length;
    const total = this.complianceItems.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    const soc2Items = this.complianceItems.filter((i) => i.category === 'SOC2');
    const soc2Completed = soc2Items.filter((i) => i.status === 'completed').length;
    const soc2Status = `${soc2Completed}/${soc2Items.length} items complete`;

    const gdprItems = this.complianceItems.filter((i) => i.category === 'GDPR');
    const gdprCompleted = gdprItems.filter((i) => i.status === 'completed').length;
    const gdprStatus = `${gdprCompleted}/${gdprItems.length} items complete`;

    return {
      totalItems: total,
      completed,
      inProgress,
      pending,
      compliancePercentage: Math.round(percentage),
      soc2Status,
      gdprStatus,
    };
  }

  /**
   * Get security findings summary
   */
  getSecuritySummary(): {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    remediationRate: number;
  } {
    const total = this.findings.length;
    const critical = this.findings.filter((f) => f.severity === 'critical').length;
    const high = this.findings.filter((f) => f.severity === 'high').length;
    const medium = this.findings.filter((f) => f.severity === 'medium').length;
    const low = this.findings.filter((f) => f.severity === 'low').length;
    const resolved = this.findings.filter((f) => f.status === 'resolved').length;
    const remediationRate = total > 0 ? (resolved / total) * 100 : 0;

    return {
      totalFindings: total,
      critical,
      high,
      medium,
      low,
      remediationRate: Math.round(remediationRate),
    };
  }
}

export const complianceTracker = new ComplianceTracker();

// Initialize compliance frameworks
complianceTracker.initializeSOC2Framework();
complianceTracker.initializeGDPRCompliance();
complianceTracker.registerDataProcessing();
complianceTracker.logPenetrationTestFindings();
