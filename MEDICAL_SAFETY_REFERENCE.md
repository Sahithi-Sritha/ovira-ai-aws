# Medical Safety Reference Guide

## Overview
This guide documents the medical safety system implemented in the Ovira AI chatbot to ensure appropriate use as an educational tool, not a diagnostic tool.

---

## 🎯 Purpose

The sanitization system serves three goals:
1. **Legal protection**: Clear disclaimers on all responses
2. **User safety**: Transparent about limitations
3. **Quality oversight**: Flag potentially problematic responses for review

---

## 🔍 How It Works

### 1. Prohibited Terms Monitoring

The system monitors for these medical terms:
```typescript
const PROHIBITED_MEDICAL_TERMS = [
    'diagnose', 'diagnosis', 
    'treatment', 'cure', 
    'prescribe', 'prescription',
    'disease', 'disorder', 'illness', 
    'medication', 'medicine', 'drug',
];
```

**Purpose**: Detect when AI may be crossing into medical advice territory

### 2. Response Processing

Every AI response goes through `sanitizeResponse()`:

```typescript
export function sanitizeResponse(text: string): string {
    // 1. Check for prohibited terms
    const containsProhibited = containsProhibitedTerms(text);
    
    // 2. Log if flagged
    if (containsProhibited) {
        console.warn('[MEDICAL TERM FLAGGED] Response requires human review:', {
            timestamp: new Date().toISOString(),
            flaggedTerms: PROHIBITED_MEDICAL_TERMS.filter(term => 
                text.toLowerCase().includes(term)
            ),
            responsePreview: text.substring(0, 200) + '...',
        });
    }

    // 3. Add disclaimer to ALL responses
    const disclaimer = '\n\n⚠️ **Important Disclaimer**: This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for personalized medical guidance.';
    
    return text + disclaimer;
}
```

### 3. Response Flow

```
User Message
    ↓
AI Model (Claude/Nova)
    ↓
sanitizeResponse()
    ↓
├─→ [Check prohibited terms]
│   ├─ Found → Log warning
│   └─ Not found → Continue
    ↓
└─→ [Add disclaimer footer]
    ↓
Return to user
```

---

## ⚠️ What We DON'T Do

### ❌ Word Replacement (OLD APPROACH)
```typescript
// REMOVED - This created nonsensical output:
text.replace(/medication/gi, 'option');
// "Take this medication" → "Take this option" ❌
```

**Why removed**: 
- Destroyed sentence meaning
- Reduced readability
- Provided no real safety benefit
- Created poor user experience

### ✅ What We Do Instead
- Preserve original AI response (readable, natural)
- Add clear disclaimer to set expectations
- Log problematic responses for human review
- Improve system prompts to reduce issues at source

---

## 🎨 System Prompt Strategy

The best defense is preventing problematic responses before they happen.

### Current System Prompts

**For Chat (chatWithAI)**:
```
You are Aria, a warm and understanding friend who specializes in women's health.

Important guidelines:
1. NEVER use clinical terms like: diagnose, diagnosis, treatment, cure, 
   prescribe, disease, disorder, illness, medication, medicine, drug, prescription
2. Instead, use friendly alternatives: "what you're experiencing", 
   "ways to manage", "things that might help", "patterns I'm noticing"
3. Always end with: "Please consult a healthcare provider for personalised advice."
4. Be conversational and natural - avoid sounding robotic or overly formal
```

**For Health Reports (generateHealthReportSummary)**:
```
CRITICAL RULES:
1. Provide ONLY non-diagnostic statistical analysis
2. Use decision-support language, NOT diagnostic language
3. Encourage professional medical consultation
4. Never use words: diagnose, treatment, cure, disease, prescribe
```

---

## 📊 Monitoring & Logging

### What Gets Logged

When prohibited terms are detected:

```javascript
{
  level: 'warn',
  message: '[MEDICAL TERM FLAGGED] Response contains prohibited medical terms and requires human review',
  data: {
    timestamp: '2026-06-09T14:35:22.123Z',
    flaggedTerms: ['medication', 'diagnosis'],
    responsePreview: 'This diagnosis requires medication...'
  }
}
```

### How to Monitor

**In Development**:
```bash
# Watch console for [MEDICAL TERM FLAGGED] warnings
npm run dev
```

**In Production**:
- CloudWatch Logs: Search for `[MEDICAL TERM FLAGGED]`
- Set up alerts for high flagging frequency
- Weekly review of flagged responses

---

## 🧪 Testing

### Run Automated Tests
```bash
npm run test:sanitize
```

### Test Cases Covered
1. ✅ Normal response (no prohibited terms)
2. ✅ Response with "medication" (should flag)
3. ✅ Response with multiple prohibited terms
4. ✅ Response about disease (should flag)

### Manual Testing

**Test 1: Normal Flow**
1. Send chat message: "What helps with period cramps?"
2. Verify response is natural and readable
3. Verify disclaimer appears at bottom
4. Check console - no warnings expected

**Test 2: Flagged Response**
1. Send message likely to trigger prohibited terms
2. Verify response remains readable (not word-replaced)
3. Verify disclaimer appears
4. Check console for `[MEDICAL TERM FLAGGED]` warning

---

## 🔧 Configuration

### Adding Prohibited Terms

Edit `src/lib/aws/bedrock.ts`:

```typescript
const PROHIBITED_MEDICAL_TERMS = [
    'diagnose', 'diagnosis', 
    // ... existing terms ...
    'new-term', // Add here
];
```

### Customizing Disclaimer

Edit the disclaimer text in `sanitizeResponse()`:

```typescript
const disclaimer = '\n\n⚠️ **Important Disclaimer**: Your custom text here...';
```

### Adjusting System Prompts

Edit prompts in:
- `chatWithAI()` - For chat conversations
- `generateHealthReportSummary()` - For health reports

---

## 📈 Success Metrics

### Week 1
- [ ] Flagging rate < 5% of responses
- [ ] Zero user complaints about readability
- [ ] All flagged responses reviewed

### Month 1
- [ ] Flagging rate < 2% (improved prompts)
- [ ] User satisfaction score maintained/improved
- [ ] Zero legal/compliance issues

---

## 🚨 Escalation

### When to Review a Flagged Response

**High Priority (Review immediately)**:
- Response gives specific dosages
- Response diagnoses a condition
- Response recommends prescription drugs
- Multiple prohibited terms in single response

**Medium Priority (Review within 24h)**:
- Single prohibited term used appropriately
- Educational context with medical terminology
- Generic mentions of "medication" or "treatment"

**Low Priority (Review weekly)**:
- False positives (e.g., "treatment" in non-medical context)
- Terms used in quoted text from user

### Action Items After Review

1. **If response is inappropriate**:
   - Refine system prompt to prevent similar responses
   - Add to prompt examples of what NOT to say
   - Consider adjusting model temperature

2. **If response is appropriate but flagged**:
   - Document as false positive
   - Consider if term should remain in prohibited list
   - No action needed on individual response

3. **If flagging rate is high**:
   - Review and improve system prompts
   - Consider model fine-tuning
   - Evaluate if prohibited terms list is too broad

---

## 👥 Team Responsibilities

### Developers
- Maintain system prompts
- Update prohibited terms list as needed
- Run tests before deployment
- Monitor logs in production

### QA
- Test new prompts thoroughly
- Verify disclaimer renders correctly
- Check mobile responsiveness
- Spot-check flagged responses

### Product/Legal
- Review disclaimer wording
- Approve changes to safety system
- Monthly review of flagged responses
- Evaluate user feedback

---

## 📚 Related Documentation

- `SANITIZATION_FIX_SUMMARY.md` - Technical details of the fix
- `SANITIZATION_FIX_CHECKLIST.md` - Acceptance criteria and verification
- `scripts/test-sanitize-response.mjs` - Automated test suite
- `src/lib/aws/bedrock.ts` - Source code implementation

---

## 🔄 Version History

### v2.0 (2026-06-09) - Current
- ✅ Removed blind word replacements
- ✅ Added universal disclaimer footer
- ✅ Implemented flagging and logging system
- ✅ Maintained consultation reminder

### v1.0 (Previous)
- ❌ Used word replacement (medication → option)
- ❌ Created nonsensical output
- ❌ No systematic logging

---

**Last Updated**: 2026-06-09  
**Maintained By**: Engineering Team  
**Next Review**: 2026-07-09
