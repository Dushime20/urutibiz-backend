# 🔐 Risk Management API Implementation Prompts for Cursor

## 🎯 Complete Implementation Guide for Risk Management System

### **API Endpoints Overview**

#### **👑 ADMIN & SUPER_ADMIN Only**
- `POST /api/v1/risk-management/profiles` - ADMIN/SUPER_ADMIN only
- `POST /api/v1/risk-management/profiles/bulk` - ADMIN/SUPER_ADMIN only
- `POST /api/v1/risk-management/violations` - ADMIN/SUPER_ADMIN/INSPECTOR
- `POST /api/v1/risk-management/enforce` - ADMIN/SUPER_ADMIN only
- `GET /api/v1/risk-management/stats` - ADMIN/SUPER_ADMIN only

#### **👥 ALL AUTHENTICATED USERS**
- `POST /api/v1/risk-management/assess` - Any authenticated user
- `POST /api/v1/risk-management/assess/bulk` - Any authenticated user
- `POST /api/v1/risk-management/compliance/check` - Any authenticated user
- `GET /api/v1/risk-management/compliance/booking/:bookingId` - Any authenticated user
- `GET /api/v1/risk-management/profiles/product/:productId` - Any authenticated user

---

## 🚀 **Cursor Implementation Prompts**

### **1. Create Admin Dashboard for Risk Management**

```
Create an admin dashboard component for risk management that includes:
- Risk profile creation form with product selection, category selection, and risk level dropdown
- Bulk risk profile creation with CSV upload functionality
- Policy violation management table with violation details and actions
- Enforcement actions panel with configurable penalties and actions
- Statistics dashboard showing compliance rates, violation trends, and risk distribution
- Use React Query for data fetching and mutations
- Implement proper error handling and loading states
- Add role-based access control to show/hide features based on user role
- Use Tailwind CSS for styling with a professional admin theme
- Include navigation tabs for different risk management sections
- Implement responsive design for mobile and desktop
- Add search and filtering capabilities
- Include export functionality for reports
- Implement real-time updates using WebSocket or polling
- Add confirmation dialogs for destructive actions
- Include audit trail for all admin actions
- Implement proper form validation with error messages
- Add loading skeletons for better UX
- Include tooltips and help text for complex features
- Implement keyboard shortcuts for power users
```

### **2. Implement Risk Profile Creation API Integration**

```
Create a React component for risk profile creation that:
- Integrates with POST /api/v1/risk-management/profiles
- Has form fields for productId, categoryId, riskLevel, mandatoryRequirements
- Includes validation for required fields
- Shows success/error messages using react-toastify
- Uses React Hook Form for form management
- Implements proper TypeScript interfaces
- Only shows for admin/super_admin roles
- Redirects to risk profile list after successful creation
- Includes a preview of the risk profile before submission
- Implements auto-save functionality
- Includes form field dependencies (risk level affects requirements)
- Shows product details when product is selected
- Includes category-specific risk factors
- Implements form reset and clear functionality
- Adds form field help text and examples
- Includes validation for business rules
- Shows estimated impact of risk profile changes
- Implements draft saving functionality
- Includes form field tooltips and guidance
- Adds confirmation before submission
- Implements form field auto-completion
```

### **3. Build Bulk Risk Profile Creation Feature**

```
Implement bulk risk profile creation that:
- Uses POST /api/v1/risk-management/profiles/bulk
- Allows CSV file upload with proper validation
- Shows upload progress and status
- Displays preview of data before processing
- Handles errors for individual rows
- Shows summary of successful/failed creations
- Includes CSV template download functionality
- Uses react-dropzone for file upload
- Implements proper error handling for file validation
- Only accessible by admin/super_admin roles
- Includes data mapping interface for CSV columns
- Shows validation errors with row numbers
- Implements batch processing with progress tracking
- Includes rollback functionality for failed batches
- Shows detailed error messages for each failed row
- Implements data preview with pagination
- Includes CSV format validation
- Shows processing statistics and summary
- Implements retry functionality for failed rows
- Includes data transformation options
- Adds support for different file formats (Excel, JSON)
- Implements data validation rules
- Shows processing timeline and estimated completion
- Includes data quality checks and warnings
- Implements data backup before processing
```

### **4. Create Policy Violation Management Interface**

```
Build a policy violation management interface that:
- Integrates with POST /api/v1/risk-management/violations
- Shows violation list with filtering and search
- Allows recording new violations with violation details
- Includes violation type, severity, description, and affected parties
- Shows violation status and resolution timeline
- Implements role-based access (admin/super_admin/inspector)
- Uses DataTable component with pagination and sorting
- Includes export functionality for violation reports
- Shows violation statistics and trends
- Implements real-time updates using WebSocket or polling
- Includes violation assignment to inspectors
- Shows violation escalation workflow
- Implements violation resolution tracking
- Includes violation impact assessment
- Shows violation history and related violations
- Implements violation notification system
- Includes violation reporting and analytics
- Shows violation trends and patterns
- Implements violation risk scoring
- Includes violation documentation and evidence
- Shows violation compliance status
- Implements violation action items and follow-ups
- Includes violation cost tracking
- Shows violation prevention recommendations
- Implements violation audit trail
- Includes violation reporting to stakeholders
```

### **5. Implement Enforcement Actions Panel**

```
Create an enforcement actions panel that:
- Uses POST /api/v1/risk-management/enforce
- Shows pending enforcement actions
- Allows triggering enforcement with configurable parameters
- Includes action types: warning, penalty, suspension, termination
- Shows enforcement history and outcomes
- Implements approval workflow for critical actions
- Only accessible by admin/super_admin roles
- Includes audit trail for all enforcement actions
- Shows impact analysis before executing actions
- Implements confirmation dialogs for destructive actions
- Includes enforcement action templates
- Shows enforcement action effectiveness metrics
- Implements enforcement action scheduling
- Includes enforcement action notifications
- Shows enforcement action compliance tracking
- Implements enforcement action escalation
- Includes enforcement action reporting
- Shows enforcement action cost analysis
- Implements enforcement action automation
- Includes enforcement action risk assessment
- Shows enforcement action stakeholder communication
- Implements enforcement action follow-up tracking
- Includes enforcement action performance metrics
- Shows enforcement action lessons learned
- Implements enforcement action continuous improvement
```

### **6. Build Statistics Dashboard**

```
Create a comprehensive statistics dashboard that:
- Uses GET /api/v1/risk-management/stats
- Shows compliance rates, violation trends, and risk distribution
- Includes interactive charts using Chart.js or Recharts
- Implements date range filtering
- Shows key performance indicators (KPIs)
- Includes export functionality for reports
- Implements real-time updates
- Only accessible by admin/super_admin roles
- Shows comparative analytics (month-over-month, year-over-year)
- Includes drill-down capabilities for detailed analysis
- Implements custom dashboard widgets
- Shows risk management performance metrics
- Includes compliance trend analysis
- Shows violation pattern analysis
- Implements predictive analytics
- Includes risk management ROI analysis
- Shows stakeholder satisfaction metrics
- Implements automated report generation
- Includes risk management benchmarking
- Shows compliance cost analysis
- Implements risk management effectiveness metrics
- Includes regulatory compliance tracking
- Shows risk management maturity assessment
- Implements risk management improvement recommendations
- Includes risk management training metrics
```

### **7. Create Risk Assessment Interface**

```
Build a risk assessment interface that:
- Uses POST /api/v1/risk-management/assess
- Allows users to assess risk for products or bookings
- Shows risk factors and scoring breakdown
- Includes recommendations based on risk level
- Shows mandatory requirements for high-risk items
- Implements step-by-step assessment wizard
- Saves assessment history
- Shows risk trends over time
- Accessible by all authenticated users
- Includes risk visualization with charts and graphs
- Implements risk assessment templates
- Shows risk assessment collaboration features
- Includes risk assessment approval workflow
- Shows risk assessment impact analysis
- Implements risk assessment reporting
- Includes risk assessment training materials
- Shows risk assessment best practices
- Implements risk assessment automation
- Includes risk assessment integration with other systems
- Shows risk assessment performance metrics
- Implements risk assessment continuous improvement
- Includes risk assessment stakeholder communication
- Shows risk assessment compliance tracking
- Implements risk assessment audit trail
- Includes risk assessment lessons learned
```

### **8. Implement Compliance Checking System**

```
Create a compliance checking system that:
- Uses POST /api/v1/risk-management/compliance/check
- Uses GET /api/v1/risk-management/compliance/booking/:bookingId
- Shows compliance status for bookings
- Highlights non-compliant items
- Provides compliance recommendations
- Shows compliance history and trends
- Implements automated compliance checking
- Shows compliance score and breakdown
- Accessible by all authenticated users
- Includes compliance reporting and analytics
- Implements compliance monitoring dashboard
- Shows compliance alerts and notifications
- Includes compliance action planning
- Shows compliance progress tracking
- Implements compliance risk assessment
- Includes compliance training requirements
- Shows compliance documentation management
- Implements compliance audit preparation
- Includes compliance stakeholder reporting
- Shows compliance performance metrics
- Implements compliance continuous monitoring
- Includes compliance improvement recommendations
- Shows compliance cost analysis
- Implements compliance automation
- Includes compliance integration with other systems
```

### **9. Create Risk Profile Viewer**

```
Build a risk profile viewer that:
- Uses GET /api/v1/risk-management/profiles/product/:productId
- Shows detailed risk profile information
- Displays risk level, mandatory requirements, and compliance status
- Shows risk assessment history
- Includes risk profile comparison
- Shows related products and categories
- Implements risk profile editing (admin only)
- Shows risk profile statistics
- Accessible by all authenticated users
- Includes risk profile export functionality
- Implements risk profile versioning
- Shows risk profile change history
- Includes risk profile impact analysis
- Shows risk profile compliance tracking
- Implements risk profile notification system
- Includes risk profile collaboration features
- Shows risk profile audit trail
- Implements risk profile reporting
- Includes risk profile integration with other systems
- Shows risk profile performance metrics
- Implements risk profile continuous improvement
- Includes risk profile stakeholder communication
- Shows risk profile lessons learned
- Implements risk profile automation
- Includes risk profile training materials
```

### **10. Implement Role-Based Access Control**

```
Implement comprehensive role-based access control that:
- Checks user roles before showing/hiding features
- Implements route protection for admin-only features
- Shows appropriate error messages for unauthorized access
- Implements role-based API calls
- Includes role-based navigation menu
- Shows role-specific dashboards
- Implements role-based data filtering
- Includes role-based action buttons
- Shows role-based statistics and reports
- Implements role-based notifications
- Includes role-based audit logging
- Shows role-based permission management
- Implements role-based data access control
- Includes role-based feature toggles
- Shows role-based workflow management
- Implements role-based approval processes
- Includes role-based reporting restrictions
- Shows role-based data export controls
- Implements role-based integration access
- Includes role-based training requirements
- Shows role-based compliance tracking
- Implements role-based performance metrics
- Includes role-based continuous improvement
- Shows role-based stakeholder communication
- Implements role-based automation controls
```

### **11. Create API Integration Layer**

```
Create a comprehensive API integration layer that:
- Implements all risk management API endpoints
- Includes proper error handling and retry logic
- Implements request/response interceptors
- Includes loading states and error states
- Implements proper TypeScript interfaces
- Includes API response caching
- Implements offline support
- Includes API rate limiting
- Implements proper authentication headers
- Includes API response validation
- Implements API request queuing
- Includes API response transformation
- Implements API error recovery
- Includes API performance monitoring
- Implements API security measures
- Includes API documentation integration
- Implements API testing utilities
- Includes API mock data for development
- Implements API response compression
- Includes API request optimization
- Implements API response streaming
- Includes API response pagination
- Implements API response filtering
- Includes API response sorting
- Implements API response aggregation
```

### **12. Build Complete Risk Management Module**

```
Create a complete risk management module that:
- Integrates all risk management features
- Implements proper navigation and routing
- Includes comprehensive error handling
- Implements proper loading states
- Includes role-based access control
- Implements proper data validation
- Includes comprehensive testing
- Implements proper documentation
- Includes performance optimization
- Implements proper security measures
- Includes user experience optimization
- Implements accessibility features
- Includes internationalization support
- Implements responsive design
- Includes offline functionality
- Implements real-time updates
- Includes data synchronization
- Implements backup and recovery
- Includes monitoring and alerting
- Implements logging and auditing
- Includes performance metrics
- Implements continuous improvement
- Includes stakeholder communication
- Implements training and support
- Includes maintenance and updates
```

---

## 🛠️ **Technology Stack Recommendations**

### **Frontend Technologies:**
```
- React 18+ with TypeScript
- React Query (TanStack Query) for data fetching
- React Hook Form for form management
- Tailwind CSS for styling
- React Router v6 for navigation
- React Toastify for notifications
- Chart.js or Recharts for data visualization
- React Dropzone for file uploads
- React Table (TanStack Table) for data tables
- React Select for dropdowns
- React DatePicker for date selection
- React Modal for modals and dialogs
- React Loading Skeleton for loading states
- React Hot Toast for notifications
- React Icons for icons
- Framer Motion for animations
- React Virtual for virtualization
- React Window for large lists
- React Intersection Observer for lazy loading
- React Error Boundary for error handling
```

### **State Management:**
```
- React Query for server state management
- Zustand for client state management
- React Context for global state
- Local Storage for persistence
- Session Storage for temporary data
- IndexedDB for large data storage
- React Query DevTools for debugging
- Redux DevTools for state debugging
- React Profiler for performance monitoring
- React Suspense for loading states
- React Concurrent Features for better UX
```

### **Testing Framework:**
```
- Jest for unit testing
- React Testing Library for component testing
- Cypress for end-to-end testing
- MSW (Mock Service Worker) for API mocking
- Testing Library User Event for user interactions
- Jest Coverage for coverage reporting
- Storybook for component documentation
- Chromatic for visual testing
- Playwright for cross-browser testing
- Detox for mobile testing
```

### **Development Tools:**
```
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Lint-staged for pre-commit linting
- TypeScript for type checking
- Vite for build tooling
- Webpack for bundling
- Babel for transpilation
- PostCSS for CSS processing
- Autoprefixer for CSS prefixes
```

### **Performance Optimization:**
```
- React.memo for component optimization
- useMemo and useCallback for expensive operations
- Code splitting with React.lazy
- Dynamic imports for lazy loading
- Image optimization with next/image
- Bundle size optimization
- Tree shaking for unused code
- Compression for assets
- CDN for static assets
- Service Workers for caching
- Web Workers for heavy computations
- Virtual scrolling for large lists
- Debouncing and throttling for user inputs
- Memoization for expensive calculations
- Lazy loading for images and components
- Preloading for critical resources
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Core Infrastructure**
- [ ] Set up React project with TypeScript
- [ ] Configure routing and navigation
- [ ] Implement authentication and role-based access
- [ ] Set up API integration layer
- [ ] Configure state management
- [ ] Set up testing framework
- [ ] Configure build and deployment

### **Phase 2: Risk Management Features**
- [ ] Implement risk profile creation
- [ ] Build bulk risk profile creation
- [ ] Create policy violation management
- [ ] Implement enforcement actions
- [ ] Build statistics dashboard
- [ ] Create risk assessment interface
- [ ] Implement compliance checking
- [ ] Build risk profile viewer

### **Phase 3: Advanced Features**
- [ ] Implement real-time updates
- [ ] Add advanced analytics
- [ ] Implement automation features
- [ ] Add reporting and export
- [ ] Implement audit trails
- [ ] Add notification system
- [ ] Implement performance optimization
- [ ] Add accessibility features

### **Phase 4: Testing and Deployment**
- [ ] Write comprehensive tests
- [ ] Perform security testing
- [ ] Optimize performance
- [ ] Deploy to production
- [ ] Monitor and maintain
- [ ] Gather user feedback
- [ ] Implement improvements
- [ ] Document the system

---

## 🎯 **Success Metrics**

### **Technical Metrics:**
- Code coverage > 90%
- Performance score > 90
- Accessibility score > 95
- Security score > 95
- Bundle size < 500KB
- Load time < 2 seconds
- Error rate < 1%

### **Business Metrics:**
- User adoption rate > 80%
- User satisfaction > 4.5/5
- Task completion rate > 95%
- Support ticket reduction > 50%
- Compliance rate > 95%
- Violation reduction > 80%
- Cost savings > 30%

---

## 🚀 **Getting Started**

1. **Copy the prompts above** and use them with Cursor
2. **Start with the core infrastructure** setup
3. **Implement features incrementally** following the phases
4. **Test thoroughly** at each step
5. **Deploy and monitor** performance
6. **Gather feedback** and iterate
7. **Document everything** for future maintenance

**This comprehensive guide provides everything needed to implement a professional Risk Management API with proper access control and a complete admin interface.**
