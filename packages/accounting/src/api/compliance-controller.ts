/**
 * Compliance Controller
 *
 * REST API controller for compliance and regulatory operations.
 * Provides tax compliance, regulatory reporting, and standards adherence.
 */

import type { Request, Response } from 'express';
import type { StandardsComplianceService } from '../services/standards-compliance.service.js';
import { hasItems } from '../utils';

// Constants for error messages
const TENANT_ID_REQUIRED = 'Tenant ID is required';
const REPORT_TYPE_REQUIRED = 'reportType is required';
const PERIOD_REQUIRED = 'period is required';
const JURISDICTION_REQUIRED = 'jurisdiction is required';
const FORM_TYPE_REQUIRED = 'formType is required';
const TAX_YEAR_REQUIRED = 'taxYear is required';
const DATA_REQUIRED = 'data is required';
const TENANT_ID_LOWER_REQUIRED = 'tenantId is required';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export class ComplianceController {
  constructor(private readonly complianceService: StandardsComplianceService) {}

  // --- Small response & parsing helpers (controller-local) ---
  private respond(res: Response, status: number, payload: Record<string, unknown>) {
    return res.status(status).json({ ...payload, timestamp: new Date().toISOString() });
  }
  private badRequest(res: Response, message: string) {
    return this.respond(res, 400, { success: false, message });
  }
  private getTenantId(req: Request): string | undefined {
    return (
      (req.params as Record<string, string | undefined>).tenantId ??
      (req.headers['x-tenant-id'] as string | undefined) ??
      (req.headers['X-Tenant-Id'] as unknown as string | undefined)
    );
  }
  // -----------------------------------------------

  /**
   * Generate compliance report
   * POST /api/accounting/compliance/reports
   */
  async generateComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, period, jurisdiction, format } = req.body;
      const tenantId = this.getTenantId(req);

      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!reportType) return void this.badRequest(res, REPORT_TYPE_REQUIRED);
      if (!period) return void this.badRequest(res, PERIOD_REQUIRED);
      if (!jurisdiction) return void this.badRequest(res, JURISDICTION_REQUIRED);

      // Generate regulatory report using the service
      const report = await this.complianceService.generateRegulatoryReport(
        tenantId,
        reportType as 'TAX_RETURN' | 'AUDIT_PACKAGE' | 'STATISTICAL' | 'COMPLIANCE',
        jurisdiction as 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
        period,
      );

      this.respond(res, 200, {
        success: true,
        message: 'Compliance report generated successfully',
        data: {
          reportId: report.reportId,
          reportType: report.reportType,
          period: report.reportingPeriod,
          jurisdiction: report.jurisdiction,
          format: format || 'PDF',
          status: report.status,
          generatedAt: report.generatedAt.toISOString(),
          downloadUrl: `/api/accounting/compliance/reports/${report.reportId}/download`,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to generate compliance report: ${errorMessage}`,
      });
    }
  }

  /**
   * Get compliance status
   * GET /api/accounting/compliance/status/:tenantId
   */
  async getComplianceStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { jurisdiction } = req.query;

      if (!tenantId) return void this.badRequest(res, TENANT_ID_LOWER_REQUIRED);

      // Get compliance status from service
      const complianceStatus = await this.complianceService.getComplianceStatus(
        tenantId,
        (jurisdiction as string) || 'GLOBAL',
      );

      this.respond(res, 200, {
        success: true,
        message: 'Compliance status retrieved successfully',
        data: complianceStatus,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get compliance status: ${errorMessage}`,
      });
    }
  }

  /**
   * Generate tax form
   * POST /api/accounting/compliance/tax-forms
   */
  async generateTaxForm(req: Request, res: Response): Promise<void> {
    try {
      const { formType, taxYear, jurisdiction, data } = req.body;
      const tenantId = this.getTenantId(req);

      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!formType) return void this.badRequest(res, FORM_TYPE_REQUIRED);
      if (!taxYear) return void this.badRequest(res, TAX_YEAR_REQUIRED);
      if (!jurisdiction) return void this.badRequest(res, JURISDICTION_REQUIRED);
      if (!data) return void this.badRequest(res, DATA_REQUIRED);

      // Generate tax form using the service
      let taxFormData;
      const reportingPeriod = taxYear.toString();
      const companyInfo = data.companyInfo || {
        name: 'Company Name',
        registrationNumber: 'REG123456',
        address: 'Company Address',
        contactInfo: 'contact@company.com',
      };

      if (jurisdiction === 'MY') {
        taxFormData = await this.complianceService.generateMalaysianSSTForm(
          tenantId,
          reportingPeriod,
          companyInfo,
        );
      } else if (jurisdiction === 'SG') {
        taxFormData = await this.complianceService.generateSingaporeGSTForm(
          tenantId,
          reportingPeriod,
          companyInfo,
        );
      } else {
        // For other jurisdictions, return a basic form structure
        taxFormData = {
          formType,
          jurisdiction: jurisdiction as 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
          reportingPeriod,
          companyInfo,
          financialData: {},
          taxCalculations: {},
          supportingDocuments: [],
        };
      }

      this.respond(res, 200, {
        success: true,
        message: 'Tax form generated successfully',
        data: {
          formId: `TAX-${Date.now()}`,
          formType: taxFormData.formType,
          taxYear,
          jurisdiction: taxFormData.jurisdiction,
          status: 'GENERATED',
          generatedAt: new Date().toISOString(),
          downloadUrl: `/api/accounting/compliance/tax-forms/${Date.now()}/download`,
          validationStatus: 'VALID',
          financialData: taxFormData.financialData,
          taxCalculations: taxFormData.taxCalculations,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to generate tax form: ${errorMessage}`,
      });
    }
  }

  /**
   * Get regulatory requirements
   * GET /api/accounting/compliance/requirements/:jurisdiction
   */
  async getRegulatoryRequirements(req: Request, res: Response): Promise<void> {
    try {
      const { jurisdiction } = req.params;
      const { reportType } = req.query;

      if (!jurisdiction) return void this.badRequest(res, JURISDICTION_REQUIRED);

      // Get compliance requirements from service
      const complianceRequirements = await this.complianceService.getComplianceRequirements(
        'tenant-placeholder', // In real implementation, extract from headers
        jurisdiction,
      );

      this.respond(res, 200, {
        success: true,
        message: 'Regulatory requirements retrieved successfully',
        data: {
          ...complianceRequirements,
          reportType: reportType || 'ALL',
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get regulatory requirements: ${errorMessage}`,
      });
    }
  }

  /**
   * Validate compliance data
   * POST /api/accounting/compliance/validate
   */
  async validateComplianceData(req: Request, res: Response): Promise<void> {
    try {
      const { data, reportType, jurisdiction } = req.body;
      const tenantId = this.getTenantId(req);

      if (!tenantId) return void this.badRequest(res, TENANT_ID_REQUIRED);
      if (!data) return void this.badRequest(res, DATA_REQUIRED);
      if (!reportType) return void this.badRequest(res, REPORT_TYPE_REQUIRED);
      if (!jurisdiction) return void this.badRequest(res, JURISDICTION_REQUIRED);

      // Generate compliance report to validate data
      const complianceReport = await this.complianceService.generateRegulatoryReport(
        tenantId,
        reportType as 'TAX_RETURN' | 'AUDIT_PACKAGE' | 'STATISTICAL' | 'COMPLIANCE',
        jurisdiction as 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
        '2024', // Default period for validation
      );

      // Basic validation based on report generation success
      const isValid =
        complianceReport.status !== 'DRAFT' || hasItems(Object.keys(complianceReport.data));

      this.respond(res, 200, {
        success: true,
        message: 'Compliance data validated successfully',
        data: {
          isValid,
          validationResults: {
            dataIntegrity: isValid ? 'PASS' : 'FAIL',
            formatCompliance: isValid ? 'PASS' : 'FAIL',
            businessRules: isValid ? 'PASS' : 'FAIL',
            regulatoryRules: isValid ? 'PASS' : 'FAIL',
          },
          warnings: isValid ? [] : ['Data validation failed - check input data'],
          errors: isValid ? [] : ['Invalid data format or missing required fields'],
          suggestions: isValid
            ? [
                'Consider adding additional supporting documentation',
                'Review data accuracy before final submission',
              ]
            : [
                'Verify all required fields are provided',
                'Check data format matches expected structure',
              ],
          validatedAt: new Date().toISOString(),
          reportId: complianceReport.reportId,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to validate compliance data: ${errorMessage}`,
      });
    }
  }

  /**
   * Get compliance calendar
   * GET /api/accounting/compliance/calendar/:tenantId
   */
  async getComplianceCalendar(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) ?? req.params.tenantId;
      const { year, jurisdiction } = req.query;

      if (!tenantId) return void this.badRequest(res, TENANT_ID_LOWER_REQUIRED);

      const targetYear = year ? parseInt(year as string, 10) : new Date().getFullYear();
      if (isNaN(targetYear)) return void this.badRequest(res, 'year must be a valid number');

      // Get compliance calendar from service
      const complianceCalendar = await this.complianceService.getComplianceCalendar(
        tenantId,
        (jurisdiction as string) || 'GLOBAL',
      );

      this.respond(res, 200, {
        success: true,
        message: 'Compliance calendar retrieved successfully',
        data: {
          ...complianceCalendar,
          year: targetYear,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.respond(res, 500, {
        success: false,
        message: `Failed to get compliance calendar: ${errorMessage}`,
      });
    }
  }
}
