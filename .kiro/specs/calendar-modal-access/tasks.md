# Implementation Plan: Calendar Modal Access

## Overview

This implementation plan breaks down the calendar modal feature into discrete coding tasks. The feature adds an interactive calendar view to the Log Symptoms page, allowing users to visually browse their historical period and symptom data with color-coded indicators. The implementation uses TypeScript/React with Next.js and integrates with the existing DynamoDB data layer.

## Tasks

- [x] 1. Set up calendar component structure and utilities
  - Create directory structure: `src/components/calendar/`
  - Create utility files: `src/lib/utils/calendar-utils.ts` and `src/lib/utils/calendar-cache.ts`
  - Define TypeScript interfaces for all calendar components
  - Set up barrel export in `src/components/calendar/index.ts`
  - _Requirements: 1.2, 2.1_

- [x] 2. Implement calendar data fetching and caching
  - [x] 2.1 Add month-based data fetching to DynamoDB layer
    - Implement `getSymptomLogsByMonth` function in `src/lib/aws/dynamodb.ts`
    - Add date range query support for efficient month-based retrieval
    - _Requirements: 7.1, 7.2_
  
  - [x] 2.2 Implement CalendarDataCache class
    - Create cache with TTL (5 minutes) in `src/lib/utils/calendar-cache.ts`
    - Implement get, set, and clear methods with month key generation
    - Add cache validation logic to check staleness
    - _Requirements: 7.5_
  
  - [ ]* 2.3 Write property test for cache behavior
    - **Property 12: Cache prevents redundant fetches**
    - **Validates: Requirements 7.5**

- [x] 3. Build CalendarModal container component
  - [x] 3.1 Create CalendarModal component with modal overlay
    - Implement modal backdrop with click-outside detection
    - Add Escape key handler for closing modal
    - Manage modal open/close state and body scroll prevention
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  
  - [x] 3.2 Add data fetching logic to CalendarModal
    - Integrate CalendarDataCache for month data management
    - Implement loading and error states
    - Add month navigation state management
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 3.3 Write property test for modal close behavior
    - **Property 1: Click-outside closes modal**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.4 Write property test for data fetch on navigation
    - **Property 10: Month navigation triggers data fetch**
    - **Validates: Requirements 7.2**
  
  - [ ]* 3.5 Write property test for loading indicator
    - **Property 11: Loading indicator during fetch**
    - **Validates: Requirements 7.3**

- [ ] 4. Implement CalendarHeader component
  - [ ] 4.1 Create CalendarHeader with month/year display
    - Display formatted month and year (e.g., "January 2024")
    - Add previous and next month navigation buttons
    - Implement navigation boundary logic (prevent future months)
    - _Requirements: 2.2, 2.3, 2.4, 2.7_
  
  - [ ]* 4.2 Write property test for navigation boundaries
    - **Property 4: Navigation boundary enforcement**
    - **Validates: Requirements 2.6, 2.7**

- [x] 5. Build CalendarGrid component
  - [x] 5.1 Implement calendar grid layout
    - Create 7-column grid with day-of-week headers
    - Calculate calendar dates (6 weeks × 7 days) including adjacent month dates
    - Implement responsive grid sizing for mobile/tablet/desktop
    - _Requirements: 2.1, 3.4, 3.5, 9.1, 9.2_
  
  - [x] 5.2 Connect symptom log data to grid
    - Map symptom logs to calendar dates
    - Pass appropriate data to CalendarDay components
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 5.3 Write property test for month display completeness
    - **Property 2: Month display completeness**
    - **Validates: Requirements 2.1**
  
  - [ ]* 5.4 Write property test for month navigation updates
    - **Property 3: Month navigation updates display**
    - **Validates: Requirements 2.5**

- [x] 6. Create CalendarDay component with visual indicators
  - [x] 6.1 Implement CalendarDay base component
    - Display day number with appropriate styling
    - Apply styling for current month vs adjacent month dates
    - Add current date (today) highlighting with border
    - Handle disabled state for future dates
    - _Requirements: 3.4, 3.5, 6.5, 10.1, 10.4_
  
  - [x] 6.2 Add FlowIndicator sub-component
    - Create colored circle indicator for flow intensity
    - Implement color mapping: light (#FCA5A5), medium (#EF4444), heavy (#991B1B)
    - Position indicator at bottom center of day cell
    - Make indicator responsive (4px mobile, 6px desktop)
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 6.3 Add SymptomIndicator sub-component
    - Create small dot indicator in top-right corner
    - Implement logic to detect symptom data (symptoms array, notes, pain level)
    - Ensure indicator is distinguishable from flow indicator
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 6.4 Implement date selection functionality
    - Add click handler for date selection
    - Trigger modal close and parent date update on selection
    - Prevent selection of future dates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.5 Write property test for flow indicator display logic
    - **Property 5: Flow indicator display logic**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 6.6 Write property test for flow color mapping
    - **Property 6: Flow color mapping correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ]* 6.7 Write property test for symptom indicator independence
    - **Property 7: Symptom indicator display with flow independence**
    - **Validates: Requirements 5.1, 5.3, 5.4**
  
  - [ ]* 6.8 Write property test for date selection behavior
    - **Property 8: Date selection closes modal and updates parent**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ]* 6.9 Write property test for date selection boundaries
    - **Property 9: Date selection boundary enforcement**
    - **Validates: Requirements 6.3, 6.4, 6.5**
  
  - [ ]* 6.10 Write property test for current date highlight coexistence
    - **Property 15: Current date highlight coexists with flow indicator**
    - **Validates: Requirements 10.3**
  
  - [ ]* 6.11 Write unit tests for CalendarDay edge cases
    - Test leap year February dates
    - Test month boundary dates
    - Test multiple indicator combinations
    - _Requirements: 3.5, 5.3, 10.3_

- [x] 7. Implement CalendarLegend component
  - [x] 7.1 Create legend with flow intensity colors
    - Display color swatches for light, medium, and heavy flow
    - Add labels for each flow level
    - Conditionally show symptom indicator explanation
    - Implement responsive layout (horizontal desktop, stacked mobile)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 7.2 Write property test for legend visibility
    - **Property 13: Legend visibility with calendar**
    - **Validates: Requirements 8.6**

- [x] 8. Checkpoint - Ensure all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integrate calendar modal with Log page
  - [x] 9.1 Update Log page to trigger modal
    - Make date display clickable in Log Symptoms page
    - Add state management for modal open/close
    - Pass selected date and date selection callback to modal
    - _Requirements: 1.1, 6.2_
  
  - [x] 9.2 Wire up date selection flow
    - Update Log page date state when date is selected from calendar
    - Ensure modal closes after date selection
    - Verify date display updates to show selected date
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 9.3 Write integration tests for modal-page interaction
    - Test modal open from date display click
    - Test date selection updates parent page
    - Test modal close returns focus to date display
    - _Requirements: 1.1, 6.1, 6.2_

- [x] 10. Add responsive design and mobile optimizations
  - [x] 10.1 Implement responsive breakpoints
    - Add Tailwind responsive classes for mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
    - Adjust modal size: full-screen mobile, 90% tablet, 700px desktop
    - Scale calendar grid and day cells appropriately
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 10.2 Optimize for touch devices
    - Ensure minimum 44px × 44px touch targets for mobile
    - Increase navigation button sizes for touch
    - Test tap interactions on all interactive elements
    - _Requirements: 9.5_
  
  - [x] 10.3 Adjust indicator sizes for mobile
    - Scale flow indicators (4px mobile, 6px desktop)
    - Ensure symptom indicators remain visible on small screens
    - Test color contrast and visibility on mobile devices
    - _Requirements: 9.4_
  
  - [ ]* 10.4 Write unit tests for responsive behavior
    - Test modal sizing at different breakpoints
    - Test touch target sizes
    - Test indicator visibility on small screens
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11. Implement accessibility features
  - [x] 11.1 Add ARIA attributes and roles
    - Add `role="dialog"` and `aria-modal="true"` to modal
    - Add `aria-label` to all interactive elements
    - Add `aria-live="polite"` to month/year display
    - Add `aria-disabled="true"` to disabled dates
    - _Requirements: 1.5, 6.5_
  
  - [x] 11.2 Implement keyboard navigation
    - Add Tab key navigation through interactive elements
    - Ensure Escape key closes modal (already implemented)
    - Add Enter/Space key support for date selection
    - _Requirements: 1.4_
  
  - [x] 11.3 Implement focus management
    - Set initial focus to modal when opened
    - Implement focus trap within modal
    - Return focus to date display when modal closes
    - Add visible focus indicators to all interactive elements
    - _Requirements: 1.5_
  
  - [ ]* 11.4 Write unit tests for accessibility
    - Test ARIA attributes are present
    - Test keyboard navigation works correctly
    - Test focus management on open/close
    - _Requirements: 1.4, 1.5_

- [x] 12. Add error handling and edge cases
  - [x] 12.1 Implement network error handling
    - Add try-catch blocks around fetch operations
    - Display user-friendly error messages in modal
    - Add retry button for failed fetches
    - Log detailed errors to console
    - _Requirements: 7.4_
  
  - [x] 12.2 Handle empty data states
    - Display calendar normally when no symptom logs exist
    - Ensure calendar remains functional for date selection
    - _Requirements: 3.2_
  
  - [ ]* 12.3 Write unit tests for error scenarios
    - Test network failure error display
    - Test retry functionality
    - Test empty data state rendering
    - _Requirements: 7.4_

- [x] 13. Optimize performance
  - [x] 13.1 Add React memoization
    - Memoize CalendarDay components with React.memo
    - Use useMemo for expensive date calculations
    - Optimize re-renders during month navigation
    - _Requirements: 2.5, 7.2_
  
  - [x] 13.2 Implement code splitting
    - Lazy load CalendarModal component
    - Use dynamic imports for calendar components
    - _Requirements: 1.1_
  
  - [ ]* 13.3 Write performance tests
    - Test render performance with large datasets
    - Test month navigation responsiveness
    - Measure and optimize bundle size
    - _Requirements: 7.1, 7.2_

- [x] 14. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Write property test for current date highlighting
  - [ ]* 15.1 Write property test for current date highlight in current month
    - **Property 14: Current date highlight in current month**
    - **Validates: Requirements 10.1, 10.4**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation uses TypeScript with React/Next.js
- All components follow existing project patterns and styling conventions
- Focus on incremental progress with checkpoints to validate functionality
