/**
 * Test file to verify pathJoin() behavior
 * This demonstrates the path joining logic without exposing the internal function
 */

import { ValidationPipeline, each, every, custom } from '../validation-pipeline-utilities';

// Test interface
interface TestData {
  items: Array<{
    name: string;
    value: number;
    nested: {
      field: string;
    };
  }>;
}

// Test validators that will generate different path patterns
const itemValidator = custom('item', (item: any) => {
  if (!item.name) return 'Name is required';
  if (typeof item.value !== 'number') return 'Value must be a number';
  if (!item.nested?.field) return 'Nested field is required';
  return true;
});

const nestedFieldValidator = custom('nestedField', (field: any) => {
  if (typeof field !== 'string') return 'Field must be a string';
  return true;
});

// Test data with various validation issues
const testData: TestData = {
  items: [
    { name: 'Item 1', value: 100, nested: { field: 'valid' } },
    { name: '', value: 'invalid', nested: { field: 123 } }, // Multiple issues
    { name: 'Item 3', value: 200, nested: { field: 'valid' } }
  ]
};

// Test function to demonstrate pathJoin behavior
export async function testPathJoinBehavior(): Promise<void> {
  console.log('Testing pathJoin behavior through validation pipeline...\n');

  // Test 1: each() validator - should generate paths like "items[1].name", "items[1].value", etc.
  console.log('1. Testing each() validator:');
  const eachValidator = new ValidationPipeline<TestData>()
    .addValidator('items', each<TestData, any>('items', itemValidator));

  const eachResult = await eachValidator.validate(testData);
  console.log('Issues found:', eachResult.issues.length);
  eachResult.issues.forEach(issue => {
    console.log(`  Path: "${issue.path}" - ${issue.message}`);
  });

  console.log('\n2. Testing every() validator:');
  const everyValidator = new ValidationPipeline<TestData>()
    .addValidator('items', every<TestData, any>('items', itemValidator));

  const everyResult = await everyValidator.validate(testData);
  console.log('Issues found:', everyResult.issues.length);
  everyResult.issues.forEach(issue => {
    console.log(`  Path: "${issue.path}" - ${issue.message}`);
  });

  console.log('\n3. Testing nested path generation:');
  const nestedValidator = new ValidationPipeline<TestData>()
    .addValidator('items', each<TestData, any>('items', 
      custom('item', (item: any) => {
        if (!item.nested) return 'Nested object is required';
        return true;
      })
    ));

  const nestedResult = await nestedValidator.validate(testData);
  console.log('Issues found:', nestedResult.issues.length);
  nestedResult.issues.forEach(issue => {
    console.log(`  Path: "${issue.path}" - ${issue.message}`);
  });

  console.log('\n4. Testing rule name prefixing:');
  const ruleNameValidator = new ValidationPipeline<TestData>()
    .addValidator('customRuleName', each<TestData, any>('items', itemValidator));

  const ruleNameResult = await ruleNameValidator.validate(testData);
  console.log('Issues found:', ruleNameResult.issues.length);
  ruleNameResult.issues.forEach(issue => {
    console.log(`  Path: "${issue.path}" - ${issue.message}`);
  });
}

// Expected path patterns:
// 1. each() and every() should generate: "items[0]", "items[1].name", "items[1].value", "items[1].nested.field"
// 2. Rule name prefixing should generate: "customRuleName.items[0]", "customRuleName.items[1].name", etc.
// 3. Array indices should be concatenated without dots: "items[1]" not "items.[1]"
// 4. Object properties should be dot-joined: "items[1].name" not "items[1]name"

if (require.main === module) {
  testPathJoinBehavior().catch(console.error);
}
