#!/usr/bin/env node

/**
 * Test script to verify sanitizeResponse behavior after removing blind word replacements
 * 
 * Verifies:
 * 1. No word replacements occur (medication stays as medication)
 * 2. All responses get disclaimer footer
 * 3. Responses with prohibited terms are flagged for review
 */

// Mock the prohibited terms list
const PROHIBITED_MEDICAL_TERMS = [
    'diagnose', 'diagnosis', 'treatment', 'cure', 'prescribe', 'prescription',
    'disease', 'disorder', 'illness', 'medication', 'medicine', 'drug',
];

function containsProhibitedTerms(text) {
    const lowerText = text.toLowerCase();
    return PROHIBITED_MEDICAL_TERMS.some(term => lowerText.includes(term));
}

function sanitizeResponse(text) {
    // Check if response contains prohibited medical terms
    const containsProhibited = containsProhibitedTerms(text);
    
    if (containsProhibited) {
        // Log for human review
        console.warn('[MEDICAL TERM FLAGGED] Response contains prohibited medical terms and requires human review:', {
            timestamp: new Date().toISOString(),
            flaggedTerms: PROHIBITED_MEDICAL_TERMS.filter(term => 
                text.toLowerCase().includes(term)
            ),
            responsePreview: text.substring(0, 200) + '...',
        });
    }

    // Add disclaimer footer to all responses
    const disclaimer = '\n\n⚠️ **Important Disclaimer**: This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for personalized medical guidance.';
    
    return text + disclaimer;
}

// Test cases
const testCases = [
    {
        name: 'Normal response (no prohibited terms)',
        input: 'Period pain is common during menstruation. Staying hydrated can help.',
        shouldFlag: false,
    },
    {
        name: 'Response with "medication" (should flag)',
        input: 'Take this medication twice daily with food.',
        shouldFlag: true,
        expectedFlags: ['medication'],
    },
    {
        name: 'Response with multiple prohibited terms',
        input: 'This diagnosis requires treatment with prescription medication.',
        shouldFlag: true,
        expectedFlags: ['diagnosis', 'treatment', 'prescription', 'medication'],
    },
    {
        name: 'Response about disease (should flag)',
        input: 'This disease can be managed with proper care.',
        shouldFlag: true,
        expectedFlags: ['disease'],
    },
];

console.log('🧪 Testing sanitizeResponse Function\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.name}`);
    console.log('─'.repeat(60));
    console.log('Input:', test.input);
    
    // Capture console.warn calls
    const originalWarn = console.warn;
    let warningCalled = false;
    let warningData = null;
    
    console.warn = (...args) => {
        if (args[0]?.includes('[MEDICAL TERM FLAGGED]')) {
            warningCalled = true;
            warningData = args[1];
        }
    };
    
    const result = sanitizeResponse(test.input);
    
    console.warn = originalWarn;
    
    // Verify no word replacements occurred
    const hasOriginalWords = test.input === result.split('\n\n⚠️')[0];
    
    // Verify disclaimer is present
    const hasDisclaimer = result.includes('⚠️ **Important Disclaimer**');
    
    // Verify flagging behavior
    const flaggedCorrectly = warningCalled === test.shouldFlag;
    
    let testPassed = true;
    
    if (!hasOriginalWords) {
        console.log('❌ FAIL: Original text was modified (word replacement detected)');
        testPassed = false;
    } else {
        console.log('✅ PASS: Original text preserved (no word replacements)');
    }
    
    if (!hasDisclaimer) {
        console.log('❌ FAIL: Disclaimer footer missing');
        testPassed = false;
    } else {
        console.log('✅ PASS: Disclaimer footer present');
    }
    
    if (!flaggedCorrectly) {
        console.log(`❌ FAIL: Flagging behavior incorrect (expected: ${test.shouldFlag}, got: ${warningCalled})`);
        testPassed = false;
    } else {
        console.log(`✅ PASS: Flagging behavior correct (flagged: ${warningCalled})`);
    }
    
    if (test.shouldFlag && warningData) {
        const actualFlags = warningData.flaggedTerms || [];
        const expectedFlags = test.expectedFlags || [];
        const allFlagsFound = expectedFlags.every(term => actualFlags.includes(term));
        
        if (!allFlagsFound) {
            console.log(`❌ FAIL: Not all expected terms flagged`);
            console.log(`   Expected: [${expectedFlags.join(', ')}]`);
            console.log(`   Got: [${actualFlags.join(', ')}]`);
            testPassed = false;
        } else {
            console.log(`✅ PASS: All expected terms flagged: [${actualFlags.join(', ')}]`);
        }
    }
    
    if (testPassed) {
        passed++;
        console.log('\n✅ Test PASSED');
    } else {
        failed++;
        console.log('\n❌ Test FAILED');
    }
});

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
    console.log('✅ All tests passed! Sanitization fix is working correctly.\n');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review the implementation.\n');
    process.exit(1);
}
