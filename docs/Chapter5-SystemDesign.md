# Chapter 5: System Design

This chapter presents the system design for the AI-powered fraud detection system, translating the requirements from Chapter 4 into technical specifications and design decisions. The design focuses on creating a machine learning system that can detect fraud in mobile money transactions in real-time while providing clear interfaces for fraud analysts to investigate suspicious activities. The chapter covers interface design for user interaction, data design for storing transactions and ML results, algorithm design for fraud detection, testing plans to validate system performance, process flows showing how the system works, and system architecture for deployment. This design phase bridges the gap between what the system needs to do and how it will actually work in Malawi's mobile money environment.

## 5.1 Interface Design

The interface design focuses on helping fraud analysts quickly identify and investigate suspicious transactions. The design emphasizes simplicity and clarity so analysts can process large amounts of information efficiently while focusing on the most important risk indicators. The system uses the brand name "FraudSense" and implements a professional, modern interface with consistent visual patterns across all pages.

### 5.1.1 Landing Page Design

**Reference**: `designs/landing-page.html`

The landing page serves as the entry point to the FraudSense system, featuring a clean and professional design with a blue gradient color scheme. The page includes a fixed navigation bar with glassmorphism effects (backdrop blur), a hero section highlighting the AI-powered fraud detection capabilities, and clear call-to-action buttons for system access. The design uses the Inter font family for modern typography and implements responsive design patterns for various screen sizes.

**Key Design Elements**:
- Fixed navigation with transparent background and blur effects
- Hero section with gradient backgrounds and professional imagery
- Feature highlights showcasing AI capabilities
- Responsive grid layouts for different device sizes
- Professional blue color scheme (#3b82f6, #1d4ed8)

### 5.1.2 Main Dashboard Interface

**Reference**: `designs/dashboard.html`

The main dashboard serves as the control center for fraud detection operations, implementing a comprehensive metrics-driven interface. The dashboard features a gradient header with blue tones (#1e40af to #3b82f6) and organized metric cards displaying key performance indicators.

**Dashboard Components**:
- **Header Section**: Gradient background with welcome message and refresh functionality
- **Metrics Grid**: Four main metric cards showing:
  - Total Transactions (blue gradient, chart icon)
  - Detected Anomalies (red gradient, shield icon)
  - Transaction Volume (green gradient, trending icon)
  - Model Accuracy (orange gradient, target icon)
- **Real-time Charts**: Interactive charts showing transaction trends and anomaly patterns
- **Quick Actions**: Accessible buttons for common fraud investigation tasks

**Visual Design Features**:
- Card-based layout with hover effects and subtle shadows
- Color-coded metric cards with gradient top borders
- Responsive grid system (auto-fit, minmax 280px)
- Professional icons from Font Awesome 6.4.0
- Smooth transitions and hover animations

### 5.1.3 Transaction Monitoring Interface

**Reference**: `designs/transaction-monitoring.html`

The transaction monitoring interface provides comprehensive transaction analysis capabilities through a structured layout optimized for investigation workflows. The interface uses a blue gradient header consistent with the overall design system.

**Interface Components**:
- **Page Header**: Blue gradient background with title and action buttons
- **Filter Panel**: Advanced filtering options for transaction search
- **Transaction Grid**: Sortable table with transaction details
- **Risk Indicators**: Color-coded risk scores and status indicators
- **Action Buttons**: Quick access to analysis and investigation functions

**Design Specifications**:
- Maximum container width: 1400px for optimal readability
- Consistent padding and margin spacing (2rem standard)
- Professional blue gradient headers (#1e40af to #3b82f6)
- Card-based content organization with rounded corners (1rem)
- Responsive design with flexible grid layouts

### 5.1.4 Fraud Case Review Interface

**Reference**: `designs/fraud-case-review.html`

The case review interface tracks investigation progress through workflow stages while maintaining audit trails for compliance. The interface uses a distinctive red gradient header (#dc2626 to #ef4444) to indicate the critical nature of fraud investigation activities.

**Case Review Components**:
- **Case Header**: Red gradient background indicating high-priority fraud cases
- **Evidence Cards**: Structured presentation of ML findings and supporting evidence
- **Investigation Timeline**: Visual workflow tracking through standardized stages
- **Decision Workflow**: Guided decision-making process with clear action buttons
- **Documentation Panel**: Comprehensive note-taking and audit trail maintenance

**Visual Hierarchy**:
- Red gradient headers for urgent fraud cases
- White content cards with subtle shadows for evidence presentation
- Consistent typography with Inter font family
- Professional spacing and alignment for optimal readability

### 5.1.5 Reports and Analytics Interface

**Reference**: `designs/reports-analytics.html`

The reports interface delivers comprehensive performance monitoring capabilities through configurable dashboards and analytics tools. The interface uses a green gradient color scheme (#059669 to #10b981) to distinguish reporting functions from operational activities.

**Reports Components**:
- **Reports Header**: Green gradient background for analytics section
- **Filter Panel**: Comprehensive filtering options with date ranges and parameters
- **Export Functionality**: Multiple format support (PDF, Excel, CSV, Word)
- **Analytics Grid**: Responsive grid layout for various report types
- **Interactive Charts**: Chart.js integration for data visualization

**Technical Implementation**:
- Chart.js library for interactive data visualization
- Responsive grid system for report cards
- Professional export buttons with hover effects
- Filter inputs with focus states and validation
- Consistent color coding for different report types

### 5.1.6 Design System Specifications

**Color Palette**:
- Primary Blue: #3b82f6 (buttons, links, primary actions)
- Dark Blue: #1d4ed8 (gradients, emphasis)
- Red: #dc2626 to #ef4444 (fraud alerts, critical actions)
- Green: #059669 to #10b981 (reports, success states)
- Orange: #f59e0b to #d97706 (warnings, metrics)
- Gray Scale: #f8fafc (background), #1f2937 (text), #6b7280 (secondary text)

**Typography**:
- Font Family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Header Sizes: 2rem to 2.5rem for main titles
- Body Text: 1rem with 1.6 line height for optimal readability
- Font Weights: 400 (normal), 600 (semibold), 700-800 (bold headers)

**Layout Specifications**:
- Maximum Container Width: 1400px for optimal viewing
- Standard Padding: 2rem for main containers
- Card Radius: 1rem for consistent rounded corners
- Grid Gaps: 1.5rem to 2rem for proper spacing
- Box Shadows: Subtle shadows (0 4px 6px rgba(0,0,0,0.05)) with hover effects

**Interactive Elements**:
- Hover Effects: translateY(-2px) for cards and buttons
- Transitions: 0.3s ease for smooth animations
- Focus States: Blue outline with box-shadow for accessibility
- Loading States: Backdrop blur effects and opacity changes
- Responsive Breakpoints: Auto-fit grids with minimum widths

The interface design successfully balances professional appearance with functional efficiency, providing fraud analysts with intuitive tools for complex investigation workflows while maintaining visual consistency across all system components.

## 5.2 Data Design

The data design creates a database structure that supports real-time transaction processing, ML model results storage, and regulatory compliance while maintaining good performance under high transaction volumes. The design uses normalized database structures to eliminate redundancy, scalable patterns for future growth, and optimized indexes for fast query performance.

[PLACEHOLDER: Insert ERD diagram showing database relationships]

The database schema includes six main entity types that store all information needed for fraud detection operations:

**Transactions Table**: This is the central table storing transaction data including transaction ID, user account information, amounts, transaction types, timestamps, location data, device information, ML risk scores, and processing status. This table supports both real-time fraud analysis and historical pattern analysis through comprehensive data coverage and optimized indexes.

**Users Table**: Manages system user accounts including user IDs, login credentials, role assignments (admin, analyst, viewer), personal information, and account status. The design includes security features like password hashing, role-based permissions, and audit trail integration for access control and compliance.

**Anomalies Table**: Stores ML model detection results including anomaly ID, transaction reference, risk scores, detection algorithms used, confidence levels, investigation status, and analyst notes. This table links ML predictions to specific transactions and tracks investigation outcomes.

**Audit_logs Table**: Provides complete system activity tracking including user actions, system events, data changes, and security activities. This supports compliance requirements and forensic investigations by capturing user ID, action type, affected entities, descriptions, timestamps, and network information.

**Rules Table**: Enables dynamic fraud rule management including rule conditions, risk weights, activation status, and performance metrics. Uses JSON structures for rule conditions to provide flexibility in expressing complex fraud detection logic while maintaining good query performance.

**Settings Table**: Stores system configuration including ML model parameters, alert thresholds, notification settings, and operational preferences that can be adjusted without code changes.

[PLACEHOLDER: Insert database schema diagram with table structures]

The data dictionary specifies data types, validation rules, and relationships for all database attributes. Transaction IDs use variable-length strings to accommodate different mobile money platform formats. Monetary amounts use high-precision decimal types for accurate financial calculations. Risk scores use decimal ranges from 0.0 to 1.0 for ML output consistency. Status fields use enumerated values for data integrity and query optimization.

## 5.3 Algorithms

The fraud detection system combines machine learning algorithms with rule-based logic to provide comprehensive fraud detection that balances accuracy, explainability, and operational efficiency. The algorithm design focuses on real-time processing, explainable decisions, and adaptive learning to evolve with changing fraud patterns while maintaining high accuracy and low false positive rates.

### 5.3.1 Machine Learning Algorithms

The system uses four unsupervised learning algorithms that work together to detect fraud without requiring labeled training data:

**Isolation Forest Algorithm**:
```
1. Load transaction data
2. Extract features (amount, time, location, user behavior)
3. Build isolation trees by randomly selecting features and split values
4. Calculate anomaly score based on path length in trees
5. Normalize score to 0-1 range (higher = more suspicious)
6. Return risk score and feature importance
```

**One-Class SVM Algorithm**:
```
1. Preprocess transaction features
2. Load trained SVM model that learned normal transaction patterns
3. Calculate distance from normal transaction boundary
4. Convert distance to anomaly score
5. Return risk score with confidence level
```

**Local Outlier Factor (LOF) Algorithm**:
```
1. Extract transaction features
2. Find k-nearest neighbors for current transaction
3. Calculate local density compared to neighbors
4. Compute LOF score (higher = more anomalous locally)
5. Normalize to 0-1 risk score
```

**Elliptic Envelope Algorithm**:
```
1. Load transaction features
2. Calculate Mahalanobis distance from normal distribution center
3. Apply robust covariance estimation
4. Convert distance to anomaly probability
5. Return normalized risk score
```

### 5.3.2 Ensemble Method

The system combines all four algorithms using weighted averaging:
```
1. Run all four algorithms on transaction
2. Collect individual risk scores (s1, s2, s3, s4)
3. Apply algorithm weights (w1=0.3, w2=0.25, w3=0.25, w4=0.2)
4. Calculate final score: final_score = w1*s1 + w2*s2 + w3*s3 + w4*s4
5. Apply threshold: if final_score > 0.7 then flag as high risk
```

### 5.3.3 Rule-Based Engine

The rule engine provides deterministic fraud detection for known patterns:
```
1. Load active fraud rules from database
2. For each rule, evaluate conditions against transaction
3. If conditions match, calculate rule risk contribution
4. Combine rule scores with ML scores
5. Generate violation report with explanations
```

**Example Rules**:
- Amount > MWK 500,000 AND time between 11PM-5AM → Risk +0.4
- Multiple transactions > MWK 100,000 within 10 minutes → Risk +0.6
- Transaction from new location AND amount > user's 95th percentile → Risk +0.5

### 5.3.4 Algorithm Selection Justification

The algorithms were selected based on evaluation criteria including interpretability for fraud investigators, robustness to data quality issues, performance on financial transaction data, and real-time processing speed. Unsupervised learning was chosen because labeled fraud data is scarce in mobile money environments, and fraud patterns evolve quickly. The ensemble approach provides better coverage of different fraud types than any single algorithm alone.

## 5.4 Test Plan

The test plan establishes systematic validation procedures to ensure the fraud detection system functions correctly, performs well, and maintains security standards. The testing strategy includes functional testing to verify features work properly, performance testing to validate system scalability, security testing to confirm protection mechanisms, and integration testing to ensure smooth operation with mobile money platforms.

### 5.4.1 Test Cases

**Test Case 1: High-Risk Transaction Detection**
- **Input**: Transaction with amount MWK 800,000 to new recipient at 2:00 AM
- **Expected Result**: Risk score > 0.8, automatic flagging for manual review
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 2: Legitimate Transaction Processing**
- **Input**: Regular MWK 50,000 transfer between established accounts at 2:00 PM
- **Expected Result**: Risk score < 0.3, automatic approval
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 3: Rule Engine Validation**
- **Input**: Three transactions of MWK 150,000 each within 5 minutes
- **Expected Result**: Velocity rule violation detected, risk score increased by 0.6
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 4: Invalid Data Handling**
- **Input**: Transaction with missing amount field
- **Expected Result**: Error response with clear message, system remains stable
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 5: ML Model Performance**
- **Input**: Batch of 1000 synthetic transactions with known fraud patterns
- **Expected Result**: Precision > 85%, Recall > 80%, Processing time < 100ms per transaction
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 6: Database Integrity**
- **Input**: Attempt to insert duplicate transaction ID
- **Expected Result**: Database constraint violation error, no data corruption
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

**Test Case 7: User Authentication**
- **Input**: Login attempt with invalid credentials
- **Expected Result**: Access denied, security event logged
- **Actual Result**: [To be filled during testing]
- **Status**: [Pass/Fail]

### 5.4.2 Performance Testing

The system must handle high transaction volumes while maintaining response times suitable for real-time fraud detection. Performance tests validate that the system can process at least 1000 transactions per minute with average response times under 200 milliseconds and 99th percentile response times under 500 milliseconds.

## 5.5 Flowcharts

The system flowcharts document the key business processes and technical workflows for fraud detection operations, user authentication, and investigation management. These process flows establish standard procedures while showing decision points, data transformations, and integration requirements for consistent system behavior and regulatory compliance.

[PLACEHOLDER: Insert flowchart showing transaction processing flow]

**Transaction Processing Flow**: This core workflow shows how transactions move through the fraud detection system from initial receipt to final decision. The process includes data validation, feature extraction, ML model prediction, rule engine evaluation, risk score calculation, decision routing, and audit logging. This ensures every transaction gets consistent analysis while maintaining performance requirements and creating complete audit trails.

[PLACEHOLDER: Insert flowchart showing user authentication flow]

**User Authentication Flow**: This workflow shows secure access control procedures including credential validation, role-based permission verification, session creation, and access policy enforcement. The flow includes multi-factor authentication options, session management, and comprehensive logging to ensure security while providing smooth user experience for authorized personnel.

[PLACEHOLDER: Insert flowchart showing fraud investigation workflow]

**Fraud Investigation Workflow**: This guides analysts through standardized case review procedures including case assignment, evidence review using ML findings, investigation documentation, decision-making processes, case closure, and audit trail maintenance. This ensures consistent investigation quality while allowing flexibility for complex cases requiring additional analysis.

## 5.6 Deployment Diagram / System Architecture

The system architecture uses a multi-tiered design that separates presentation, business logic, data management, and machine learning components to ensure scalability, maintainability, and operational reliability. The architecture emphasizes loose coupling between components, standard communication protocols, and comprehensive monitoring for high-availability operations.

[PLACEHOLDER: Insert system architecture diagram showing all components]

**Frontend Layer**: Uses React TypeScript to provide responsive web interfaces that work on various devices while maintaining consistent user experience. The presentation layer includes real-time dashboard updates through WebSocket connections, progressive web app capabilities for offline functionality, and accessibility features for diverse users. Component-based architecture enables modular development and supports customization for different user roles.

**Backend Layer**: Implements Node.js Express server architecture providing RESTful API endpoints for client communication, authentication middleware for security, and scalable request processing for concurrent users and high-volume transactions. The server uses microservices design principles enabling independent scaling of different components based on demand.

**Database Layer**: Uses PostgreSQL as primary data storage with Redis for session management and caching to improve performance. The data architecture includes automated backups, disaster recovery procedures, and connection pooling for data availability and reliability. Database design incorporates partitioning and indexing optimization for efficient query processing of large transaction volumes.

**Machine Learning Pipeline**: Operates as independent service layer providing model training capabilities, real-time inference services, and feature engineering pipelines for continuous model improvement. The ML architecture enables model versioning, A/B testing, and performance monitoring to ensure optimal detection accuracy while maintaining processing performance.

[PLACEHOLDER: Insert deployment diagram showing infrastructure components]

**Deployment Architecture**: Incorporates enterprise-grade infrastructure including Nginx reverse proxy for load balancing and SSL termination, containerized application deployment through Docker, and comprehensive monitoring systems for real-time operational visibility and automated alerting. The infrastructure emphasizes high availability through redundant components, automated failover, and scalable resource allocation.

**Security Architecture**: Implements multiple protection layers including JWT-based authentication, role-based access control, input validation and sanitization, SQL injection prevention through parameterized queries, cross-site scripting protection, CSRF token validation, API rate limiting, and comprehensive audit logging for security monitoring and regulatory compliance.

**Performance Optimization**: Incorporates horizontal scaling through additional server instances, database connection pooling for resource optimization, intelligent caching to reduce database load, asynchronous processing for non-critical operations, and load balancing algorithms for efficient resource distribution. The system targets API response times under 200 milliseconds, transaction processing within one second, system availability exceeding 99.9%, and support for over 100 concurrent users.
