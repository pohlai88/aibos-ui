import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  toJSONSchema, 
  toOpenAPISchema, 
  buildOpenAPIDoc,
  buildCrudPaths,
  compileAjvValidator,
  registerOpenApiSchemasWithAjv,
  createAjvExpressMiddleware,
  createOpenApiExpressMiddleware,
  type Schema,
  type AjvValidator
} from '../object-utilities';

describe('JSON Schema + OpenAPI Generators', () => {
  describe('toJSONSchema', () => {
    it('should convert basic scalar types', () => {
      const stringSchema: Schema = { type: 'string' };
      const numberSchema: Schema = { type: 'number' };
      const booleanSchema: Schema = { type: 'boolean' };
      const dateSchema: Schema = { type: 'date' };
      const nullSchema: Schema = { type: 'null' };
      const undefinedSchema: Schema = { type: 'undefined' };

      expect(toJSONSchema(stringSchema)).toEqual({ type: 'string' });
      expect(toJSONSchema(numberSchema)).toEqual({ type: 'number' });
      expect(toJSONSchema(booleanSchema)).toEqual({ type: 'boolean' });
      expect(toJSONSchema(dateSchema)).toEqual({ type: 'string', format: 'date-time' });
      expect(toJSONSchema(nullSchema)).toEqual({ type: 'null' });
      expect(toJSONSchema(undefinedSchema)).toEqual({});
    });

    it('should handle string constraints', () => {
      const enumSchema: Schema = { 
        type: 'string', 
        enum: ['active', 'inactive', 'pending'] 
      };
      const patternSchema: Schema = { 
        type: 'string', 
        pattern: /^[A-Z0-9.]{3,40}$/ 
      };

      expect(toJSONSchema(enumSchema)).toEqual({ 
        type: 'string', 
        enum: ['active', 'inactive', 'pending'] 
      });
      expect(toJSONSchema(patternSchema)).toEqual({ 
        type: 'string', 
        pattern: '^[A-Z0-9.]{3,40}$' 
      });
    });

    it('should handle number constraints', () => {
      const numberSchema: Schema = { 
        type: 'number', 
        min: 0, 
        max: 100 
      };

      expect(toJSONSchema(numberSchema)).toEqual({ 
        type: 'number', 
        minimum: 0, 
        maximum: 100 
      });
    });

    it('should handle arrays', () => {
      const arraySchema: Schema = { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
      };

      expect(toJSONSchema(arraySchema)).toEqual({ 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
      });
    });

    it('should handle objects with properties', () => {
      const objectSchema: Schema = { 
        type: 'object', 
        properties: {
          id: { type: 'string' },
          name: { type: 'string', optional: true },
          count: { type: 'number' }
        },
        additionalProperties: false
      };

      const result = toJSONSchema(objectSchema);
      expect(result).toEqual({ 
        type: 'object', 
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          count: { type: 'number' }
        },
        required: ['id', 'count'],
        additionalProperties: false
      });
    });

    it('should handle anyOf unions', () => {
      const unionSchema: Schema = { 
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      };

      expect(toJSONSchema(unionSchema)).toEqual({ 
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      });
    });

    it('should handle optional properties correctly', () => {
      const schema: Schema = { 
        type: 'object', 
        properties: {
          required: { type: 'string' },
          optional: { type: 'string', optional: true },
          undefinedType: { type: 'undefined' }
        }
      };

      const result = toJSONSchema(schema);
      expect(result.required).toEqual(['required']);
      expect(result.properties.optional).toEqual({ type: 'string' });
      expect(result.properties.undefinedType).toEqual({});
    });
  });

  describe('toOpenAPISchema', () => {
    it('should generate OpenAPI 3.1 schema by default', () => {
      const schema: Schema = { 
        type: 'object', 
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const result = toOpenAPISchema(schema);
      expect(result).toEqual({ 
        type: 'object', 
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age']
      });
    });

    it('should convert nullable types for OpenAPI 3.0', () => {
      const nullableSchema: Schema = { 
        anyOf: [
          { type: 'string' },
          { type: 'null' }
        ]
      };

      const result30 = toOpenAPISchema(nullableSchema, { version: '3.0' });
      expect(result30).toEqual({ 
        anyOf: [
          { type: 'string' },
          { nullable: true }
        ]
      });

      const result31 = toOpenAPISchema(nullableSchema, { version: '3.1' });
      expect(result31).toEqual({ 
        anyOf: [
          { type: 'string' },
          { type: 'null' }
        ]
      });
    });

    it('should handle explicit null types in OpenAPI 3.0', () => {
      const nullSchema: Schema = { type: 'null' };

      const result30 = toOpenAPISchema(nullSchema, { version: '3.0' });
      expect(result30).toEqual({ nullable: true });

      const result31 = toOpenAPISchema(nullSchema, { version: '3.1' });
      expect(result31).toEqual({ type: 'null' });
    });
  });

  describe('buildOpenAPIDoc', () => {
    it('should build minimal OpenAPI 3.1 document', () => {
      const schemas = {
        Account: {
          type: 'object' as const,
          properties: {
            accountCode: { type: 'string' as const, pattern: /^[A-Z0-9.]{3,40}$/ },
            balance: { type: 'number' as const, min: 0 },
            isActive: { type: 'boolean' as const, optional: true },
            tags: { 
              type: 'array' as const, 
              items: { type: 'string' as const }, 
              optional: true, 
              maxItems: 20 
            },
            openedAt: { type: 'date' as const, optional: true }
          },
          additionalProperties: false
        } as Schema
      };

      const doc = buildOpenAPIDoc({ schemas });
      
      expect(doc.openapi).toBe('3.1.0');
      expect(doc.info).toEqual({ title: 'API', version: '1.0.0' });
      expect(doc.components.schemas.Account).toEqual({
        type: 'object',
        properties: {
          accountCode: { type: 'string', pattern: '^[A-Z0-9.]{3,40}$' },
          balance: { type: 'number', minimum: 0 },
          isActive: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
          openedAt: { type: 'string', format: 'date-time' }
        },
        required: ['accountCode', 'balance'],
        additionalProperties: false
      });
    });

    it('should build OpenAPI 3.0 document with nullable conversion', () => {
      const schemas = {
        MaybeString: {
          anyOf: [
            { type: 'string' as const },
            { type: 'null' as const }
          ]
        } as Schema
      };

      const doc = buildOpenAPIDoc({ schemas }, { version: '3.0' });
      
      expect(doc.openapi).toBe('3.0.3');
      expect(doc.components.schemas.MaybeString).toEqual({
        anyOf: [
          { type: 'string' },
          { nullable: true }
        ]
      });
    });

    it('should include custom info and servers', () => {
      const schemas = {
        User: { type: 'object' as const, properties: { name: { type: 'string' as const } } } as Schema
      };

      const doc = buildOpenAPIDoc({ schemas }, {
        version: '3.1',
        info: { title: 'Accounting API', version: '1.2.0', description: 'Enterprise accounting system' },
        servers: [{ url: 'https://api.example.com', description: 'Production server' }]
      });

      expect(doc.info).toEqual({ 
        title: 'Accounting API', 
        version: '1.2.0', 
        description: 'Enterprise accounting system' 
      });
      expect(doc.servers).toEqual([{ 
        url: 'https://api.example.com', 
        description: 'Production server' 
      }]);
    });

    it('should include custom paths', () => {
      const schemas = {
        Account: { type: 'object' as const, properties: { id: { type: 'string' as const } } } as Schema
      };

      const paths = {
        '/accounts/{id}': {
          get: {
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
            ],
            responses: {
              '200': { 
                description: 'OK', 
                content: { 
                  'application/json': { 
                    schema: { $ref: '#/components/schemas/Account' } 
                  } 
                } 
              }
            }
          }
        }
      };

      const doc = buildOpenAPIDoc({ schemas, paths });
      expect(doc.paths).toEqual(paths);
    });
  });

  describe('Real-world examples', () => {
    it('should handle complex accounting schema', () => {
      const AccountSchema: Schema = {
        type: 'object',
        additionalProperties: false,
        properties: {
          accountCode: { type: 'string', pattern: /^[A-Z0-9.]{3,40}$/ },
          balance: { type: 'number', min: 0 },
          isActive: { type: 'boolean', optional: true },
          tags: { type: 'array', items: { type: 'string' }, optional: true, maxItems: 20 },
          openedAt: { type: 'date', optional: true },
          metadata: {
            type: 'object',
            properties: {
              department: { type: 'string', optional: true },
              costCenter: { type: 'string', optional: true }
            },
            optional: true
          }
        }
      };

      const jsonSchema = toJSONSchema(AccountSchema);
      
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties.accountCode.pattern).toBe('^[A-Z0-9.]{3,40}$');
      expect(jsonSchema.properties.balance.minimum).toBe(0);
      expect(jsonSchema.properties.openedAt.format).toBe('date-time');
      expect(jsonSchema.required).toEqual(['accountCode', 'balance']);
      expect(jsonSchema.additionalProperties).toBe(false);
    });

    it('should generate complete OpenAPI document for accounting API', () => {
      const schemas = {
        Account: {
          type: 'object' as const,
          properties: {
            accountCode: { type: 'string' as const, pattern: /^[A-Z0-9.]{3,40}$/ },
            balance: { type: 'number' as const, min: 0 },
            isActive: { type: 'boolean' as const, optional: true }
          },
          additionalProperties: false
        } as Schema,
        JournalEntry: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const },
            amount: { type: 'number' as const },
            accountCode: { type: 'string' as const },
            postedAt: { type: 'date' as const }
          }
        } as Schema
      };

      const doc = buildOpenAPIDoc({ schemas }, {
        version: '3.1',
        info: { title: 'Accounting API', version: '1.0.0' },
        servers: [{ url: 'https://api.accounting.com' }]
      });

      expect(doc.openapi).toBe('3.1.0');
      expect(doc.info.title).toBe('Accounting API');
      expect(doc.servers[0].url).toBe('https://api.accounting.com');
      expect(Object.keys(doc.components.schemas)).toEqual(['Account', 'JournalEntry']);
      expect(doc.components.schemas.Account.type).toBe('object');
      expect(doc.components.schemas.JournalEntry.type).toBe('object');
    });
  });

  describe('buildCrudPaths', () => {
    it('should generate basic CRUD paths', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode'
      });

      expect(paths).toHaveProperty('/accounts');
      expect(paths).toHaveProperty('/accounts/{accountCode}');
      
      // Collection endpoints
      expect(paths['/accounts'].get).toBeDefined();
      expect(paths['/accounts'].post).toBeDefined();
      
      // Individual resource endpoints
      expect(paths['/accounts/{accountCode}'].get).toBeDefined();
      expect(paths['/accounts/{accountCode}'].delete).toBeDefined();
      expect(paths['/accounts/{accountCode}'].patch).toBeDefined();
      
      // Should not include PUT by default
      expect(paths['/accounts/{accountCode}'].put).toBeUndefined();
    });

    it('should include pagination parameters', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode',
        pagination: {
          defaultPageSize: 50,
          maxPageSize: 200
        }
      });

      const listParams = paths['/accounts'].get.parameters;
      expect(listParams).toHaveLength(2);
      expect(listParams[0].name).toBe('page');
      expect(listParams[1].name).toBe('pageSize');
      expect(listParams[1].schema.maximum).toBe(200);
      expect(listParams[1].schema.default).toBe(50);
    });

    it('should include PUT when requested', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode',
        put: true
      });

      expect(paths['/accounts/{accountCode}'].put).toBeDefined();
    });

    it('should skip PATCH when disabled', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode',
        patch: false
      });

      expect(paths['/accounts/{accountCode}'].patch).toBeUndefined();
    });

    it('should include auth stubs when requested', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode',
        authStubs: true
      });

      expect(paths['/accounts'].get.responses['401']).toBeDefined();
      expect(paths['/accounts'].get.responses['403']).toBeDefined();
    });

    it('should use custom tags', () => {
      const paths = buildCrudPaths({
        resource: 'accounts',
        schemaRefName: 'Account',
        idParam: 'accountCode',
        tags: ['Accounting', 'Finance']
      });

      expect(paths['/accounts'].get.tags).toEqual(['Accounting', 'Finance']);
    });
  });

  describe('AJV Integration', () => {
    // Mock AJV instance for testing
    const mockAjv = {
      compile: vi.fn(),
      addSchema: vi.fn()
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should compile validator function', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const validator = compileAjvValidator(mockAjv, schema);
      
      expect(mockAjv.compile).toHaveBeenCalledWith({ type: 'string' });
      expect(typeof validator).toBe('function');
    });

    it('should handle validation success', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const validator = compileAjvValidator(mockAjv, schema);
      const result = validator('test');
      
      expect(result).toEqual({ ok: true, errors: [], value: 'test' });
    });

    it('should handle validation failure', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(false) as any;
      mockValidate.errors = [
        { instancePath: '/name', message: 'must be string' }
      ];
      mockAjv.compile.mockReturnValue(mockValidate);

      const validator = compileAjvValidator(mockAjv, schema);
      const result = validator(123);
      
      expect(result.ok).toBe(false);
      expect(result.errors).toEqual(['/name: must be string']);
    });

    it('should register schemas with AJV', () => {
      const schemas = {
        Account: { type: 'object' as const, properties: { name: { type: 'string' as const } } } as Schema
      };

      registerOpenApiSchemasWithAjv(mockAjv, schemas);
      
      expect(mockAjv.addSchema).toHaveBeenCalledWith(
        { 
          type: 'object', 
          properties: { name: { type: 'string' } }, 
          required: ['name'],
          $id: '#/components/schemas/Account' 
        },
        '#/components/schemas/Account'
      );
    });
  });

  describe('Express Middleware Integration', () => {
    const mockAjv = {
      compile: vi.fn(),
      addSchema: vi.fn()
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create AJV Express middleware', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const middleware = createAjvExpressMiddleware(mockAjv, schema);
      expect(typeof middleware).toBe('function');
    });

    it('should validate request body and call next on success', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const middleware = createAjvExpressMiddleware(mockAjv, schema);
      
      const req: any = { body: 'test' };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedData).toBe('test');
    });

    it('should return 400 on validation failure', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(false) as any;
      mockValidate.errors = [{ instancePath: '', message: 'must be string' }];
      mockAjv.compile.mockReturnValue(mockValidate);

      const middleware = createAjvExpressMiddleware(mockAjv, schema);
      
      const req: any = { body: 123 };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [': must be string']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate query parameters when target is query', () => {
      const schema: Schema = { type: 'string' };
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const middleware = createAjvExpressMiddleware(mockAjv, schema, { target: 'query' });
      
      const req: any = { query: 'test' };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedData).toBe('test');
    });

    it('should create OpenAPI Express middleware', () => {
      const mockValidate: AjvValidator = vi.fn().mockReturnValue(true) as any;
      mockAjv.compile.mockReturnValue(mockValidate);

      const middleware = createOpenApiExpressMiddleware(mockAjv, '#/components/schemas/Account');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Integration Examples', () => {
    it('should create complete OpenAPI document with CRUD paths', () => {
      const AccountSchema: Schema = {
        type: 'object',
        properties: {
          accountCode: { type: 'string', pattern: /^[A-Z0-9.]{3,40}$/ },
          balance: { type: 'number', min: 0 },
          isActive: { type: 'boolean', optional: true }
        },
        additionalProperties: false
      };

      const doc = buildOpenAPIDoc({
        schemas: { Account: AccountSchema },
        paths: buildCrudPaths({
          resource: 'accounts',
          schemaRefName: 'Account',
          idParam: 'accountCode',
          pagination: { defaultPageSize: 50, maxPageSize: 200 },
          authStubs: true
        })
      }, {
        version: '3.1',
        info: { title: 'Accounting API', version: '1.3.0' },
        servers: [{ url: 'https://api.accounting.com' }]
      });

      expect(doc.openapi).toBe('3.1.0');
      expect(doc.info.title).toBe('Accounting API');
      expect(doc.paths['/accounts']).toBeDefined();
      expect(doc.paths['/accounts/{accountCode}']).toBeDefined();
      expect(doc.components.schemas.Account).toBeDefined();
    });
  });
});
