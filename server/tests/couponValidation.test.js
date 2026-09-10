const Coupon = require('../models/CouponSchema');
const couponController = require('../controllers/couponController');

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
}

async function runTests() {
  console.log('=== Running Coupon Validation Tests ===\n');
  let passed = 0;
  let failed = 0;

  async function testCase(name, body, expectedStatus, expectedSuccess, expectedMessageSubstring) {
    const req = { body };
    const res = createMockRes();

    const originalFindOne = Coupon.findOne;
    const originalCreate = Coupon.create;

    Coupon.findOne = async () => null;
    Coupon.create = async (data) => {
      const doc = new Coupon(data);
      await doc.validate();
      return doc;
    };

    try {
      await couponController.createCoupon(req, res);

      const statusOk = res.statusCode === expectedStatus;
      const successOk = res.data && res.data.success === expectedSuccess;
      const messageOk = expectedMessageSubstring
        ? (res.data && res.data.message && res.data.message.includes(expectedMessageSubstring))
        : true;

      if (statusOk && successOk && messageOk) {
        console.log('[PASS] ' + name);
        passed++;
      } else {
        console.log('[FAIL] ' + name);
        console.log('  Expected status ' + expectedStatus + ', got ' + res.statusCode);
        console.log('  Expected success ' + expectedSuccess + ', got ' + res.data?.success);
        console.log('  Expected message containing "' + expectedMessageSubstring + '", got "' + res.data?.message + '"');
        failed++;
      }
    } catch (err) {
      console.log('[FAIL] ' + name + ' - Threw error: ' + err.message);
      failed++;
    } finally {
      Coupon.findOne = originalFindOne;
      Coupon.create = originalCreate;
    }
  }

  const baseBody = {
    code: 'TESTCODE',
    discountType: 'percent',
    discountValue: 10,
    expiresAt: '2030-01-01'
  };

  // 1. Percentage = 1 -> accepted
  await testCase('Percentage = 1 -> accepted', { ...baseBody, discountValue: 1 }, 201, true);

  // 2. Percentage = 70 -> accepted
  await testCase('Percentage = 70 -> accepted', { ...baseBody, discountValue: 70 }, 201, true);

  // 3. Percentage = 71 -> rejected
  await testCase('Percentage = 71 -> rejected', { ...baseBody, discountValue: 71 }, 400, false, 'Percentage discount must be between 1% and 70%.');

  // 4. Percentage = 100 -> rejected
  await testCase('Percentage = 100 -> rejected', { ...baseBody, discountValue: 100 }, 400, false, 'Percentage discount must be between 1% and 70%.');

  // 5. Percentage = 0 -> rejected
  await testCase('Percentage = 0 -> rejected', { ...baseBody, discountValue: 0 }, 400, false, 'Percentage discount must be between 1% and 70%.');

  // 6. Percentage < 0 -> rejected
  await testCase('Percentage < 0 -> rejected', { ...baseBody, discountValue: -10 }, 400, false, 'Percentage discount must be between 1% and 70%.');

  // 7. Usage Limit = 1 -> accepted
  await testCase('Usage Limit = 1 -> accepted', { ...baseBody, usageLimit: 1 }, 201, true);

  // 8. Usage Limit = 0 -> rejected
  await testCase('Usage Limit = 0 -> rejected', { ...baseBody, usageLimit: 0 }, 400, false, 'Usage limit must be greater than 0.');

  // 9. Usage Limit < 0 -> rejected
  await testCase('Usage Limit < 0 -> rejected', { ...baseBody, usageLimit: -5 }, 400, false, 'Usage limit must be greater than 0.');

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});