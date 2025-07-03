## Known Issues & Limitations

### Current Technical Limitations
1. **Temporary Authorization**: All models use `allow.authenticated()` instead of proper group-based permissions
2. **localStorage Dependency**: Name reservations stored locally instead of database (TempEntity model needed)
3. **N+1 Query Pattern**: Individual entity fetches instead of efficient batch operations
4. **Manual Relationship Traversal**: Junction table relationships require manual query building
5. **No Real Service Workflows**: ServiceModal contains placeholder actions without actual business logic

### Performance Considerations
1. **Client-side Joins**: Relationship data assembled in frontend instead of database-level joins
2. **Multiple API Calls**: Director dashboard makes numerous sequential API calls for association data
3. **Lookup Map Building**: Frontend builds director/entity lookup maps from multiple queries
4. **No Caching**: Repeated data fetches without client-side caching mechanisms

### Data Consistency Issues
1. **Profile Merging**: Complex logic for merging email-based and Cognito-based user profiles
2. **Association Synchronization**: No automatic cleanup when entities are deleted
3. **Role Switching**: Profile data may become inconsistent during role changes
4. **Concurrent Updates**: No optimistic locking or conflict resolution for simultaneous edits

### Security & Validation Gaps
1. **Input Validation**: Limited validation on form inputs and API calls
2. **Authorization Bypass**: Current authentication model allows cross-role data access
3. **Data Sanitization**: No comprehensive XSS or injection attack protection
4. **Audit Trail**: No tracking of who made what changes when

## Integration Requirements

### MCA.gov.in Integration (Planned)
**Purpose**: Link to official Ministry of Corporate Affairs data
**Features Needed**:
- **Company Master Dashboard**: Real-time sync with MCA company database
- **Status Verification**: Cross-reference company status with official records
- **Document Validation**: Verify incorporation certificates and filings
- **Compliance Tracking**: Monitor statutory filing deadlines and requirements

**Technical Approach**:
- Web scraping initially (Python script provided in `/scripts/scrape_mca.py`)
- API integration when available
- Scheduled data synchronization jobs

### Document Management Integration
**Requirements**: Based on project requirements document
- **Template System**: Pre-configured forms for each compliance service
- **Wet Ink Signatures**: Digital signature workflow integration
- **Document Repository**: Secure storage with version control
- **Status Tracking**: Document workflow from "Info Received" → "In Process/Clarification" → "Completion"

### Planned Services (From Requirements)
#### Annual Filing Templates
- **Form MGT-7**: Annual return form
- **Form AOC-4**: Financial statement filing  
- **Director Report**: Annual director reporting
- **Shareholders List/Transfers**: Share transfer documentation

#### Change of Director Templates
- **Appointment**: New director appointment forms
- **Resignation**: Director resignation processing

#### Additional Services
- **Director KYC**: Know Your Customer documentation
- **Auditor Appointment**: Auditor selection and appointment
- **AGM Minutes**: Annual General Meeting documentation
- **BM Minutes**: Board Meeting documentation  
- **Resolutions**: Corporate resolution management
- **Transfer of Shares**: Share transfer processing
- **Bank Account Opening**: Corporate banking facilitation

## Success Metrics & KPIs

### User Adoption Metrics
- Active professional users managing entities
- Active director users with verified associations
- Entity creation completion rates
- Service workflow completion rates

### System Performance Metrics  
- Page load times and API response times
- Error rates and system uptime
- Data synchronization accuracy with MCA
- User session duration and engagement

### Business Value Metrics
- Time reduction in compliance processes
- Document processing efficiency
- Compliance deadline adherence rates
- User satisfaction and feedback scores

## Deployment Status & Next Steps

### Current Deployment Status
**Environment**: AWS Amplify Production  
**Last Successful Deploy**: 2025-07-03
**Status**: ✅ Stable and operational

### Immediate Action Items (Next 2 Weeks)
1. **Fix Authorization**: Implement proper Cognito group-based permissions
2. **Database Migration**: Create TempEntity model and migrate localStorage data
3. **Performance Optimization**: Implement batch queries and caching
4. **Input Validation**: Add comprehensive form and API validation

### Short-term Goals (Next Month)
1. **Service Workflows**: Build actual business logic for incorporation services
2. **Document Templates**: Create and integrate compliance form templates
3. **MCA Integration**: Implement basic web scraping for company data verification
4. **Notification System**: Add email notifications for status changes

### Long-term Vision (Next Quarter)
1. **Complete Entity Lifecycle**: Full entity creation from name reservation to incorporation
2. **Advanced Services**: Annual filing, director management, and corporate changes
3. **Document Management**: File upload, digital signatures, and repository
4. **Reporting Dashboard**: Analytics and compliance tracking for professionals

This project represents a comprehensive solution for corporate compliance management in India, with a solid foundation already built and clear roadmap for enhancement and scaling.# Corporate Compliance Portal - Project Context

## Project Overview
A comprehensive web and mobile application for LLP/Company compliance in India, built on AWS Amplify Gen 2. The platform serves two primary user personas: Compliance Professionals and Directors, enabling streamlined corporate compliance management including entity creation, director associations, and service workflows.

**Version**: 1.0.0 | **Last Updated**: 2025-07-03 | **Status**: In Active Development

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: AWS Amplify Gen 2 (GraphQL API + DynamoDB via AWS AppSync)
- **Authentication**: Amazon Cognito User Pools with groups (DIRECTORS, PROFESSIONALS)
- **Deployment**: AWS Amplify Hosting with CI/CD pipeline
- **State Management**: React state + localStorage for role persistence
- **Styling**: Component-scoped CSS with responsive design

## User Roles & Permissions

### DIRECTORS Role
**Description**: Company/LLP directors who can create entities and manage their associations

**Permissions**:
- Create entities through name reservation process
- View own entities and associations
- Submit name reservations for new companies/LLPs
- View assigned compliance professionals
- Track entity creation progress
- Submit change requests (planned)

**Dashboard Access**: DirectorDashboard with 6 tabs:
1. **My Associations** - View entity associations and appointment details
2. **Companies** - View associated companies with director role details
3. **LLPs** - View associated LLPs with partner role details  
4. **Professional Associations** - See assigned compliance professionals
5. **Entities in Progress** - Create new entities via name reservation + track status
6. **Change Requests** - Submit and track change requests (future)

### PROFESSIONALS Role  
**Description**: Compliance professionals who manage multiple entities and director relationships

**Permissions**:
- Manage assigned entities (companies and LLPs)
- View and edit company/LLP details
- Manage director associations and appointments
- Access service management workflows
- Create new entities and automatically get assigned
- Execute compliance services and actions

**Dashboard Access**: ProfessionalDashboard with 3 tabs:
1. **My Companies** - View/manage assigned companies with service actions
2. **My LLPs** - View/manage assigned LLPs with service actions  
3. **Director Associations** - Manage director-entity relationships

## Core Data Models

### UserProfile
**Purpose**: Links Cognito users to application roles and provides profile information
- `userId`: Cognito username or generated ID (Primary Key)
- `email`: User's email address (used for lookups)
- `role`: 'DIRECTORS' | 'PROFESSIONALS' (determines dashboard access)
- `displayName`: Display name for the user
**Relationships**: 
- `professionalAssignments` (hasMany) - Professional's entity assignments
- `directorAssociations` (hasMany) - Director's entity associations  
- `changeRequests` (hasMany) - Change requests submitted by director

#### Company
- `cinNumber`: Corporate Identification Number (Primary Key)
- `companyName`: Legal company name
- `companyType`: PRIVATE | PUBLIC | ONE_PERSON | SECTION_8
- `companyStatus`: ACTIVE | INACTIVE | UNDER_PROCESS
- `dateOfIncorporation`: Incorporation date
- `rocName`: Registrar of Companies
- `registeredAddress`: Legal address
- `authorizedCapital`: Authorized share capital
- `paidUpCapital`: Paid-up share capital
- `numberOfDirectors`: Current director count

#### LLP (Limited Liability Partnership)
- `llpIN`: LLP Identification Number (Primary Key)  
- `llpName`: Legal LLP name
- `llpStatus`: ACTIVE | INACTIVE | UNDER_PROCESS
- `dateOfIncorporation`: Incorporation date
- `numberOfPartners`: Total partner count
- `numberOfDesignatedPartners`: Designated partner count
- `totalObligationOfContribution`: Total contribution obligation

### ProfessionalAssignment (Many-to-Many Junction)
**Purpose**: Links compliance professionals to entities they manage
- `professionalId`: Reference to professional's UserProfile.userId (Foreign Key)
- `entityId`: Company.id or LLP.id (Foreign Key)
- `entityType`: 'COMPANY' | 'LLP' (indicates which table entityId references)
- `role`: PRIMARY | SECONDARY | REVIEWER (professional's role for this entity)
- `assignedDate`: Date when professional was assigned
- `isActive`: Boolean flag for active assignment status
**Relationship**: `professional` belongsTo UserProfile via professionalId

### DirectorAssociation (Many-to-Many Junction)
**Purpose**: Links directors to entities they're associated with  
- `userId`: Reference to director's UserProfile.userId (Foreign Key)
- `entityId`: Company.id or LLP.id (Foreign Key)
- `entityType`: 'COMPANY' | 'LLP' (indicates which table entityId references)
- `associationType`: DIRECTOR | DESIGNATED_PARTNER | PARTNER (director's role)
- `appointmentDate`: Date of director appointment
- `isActive`: Boolean flag for active association status
**Relationship**: `director` belongsTo UserProfile via userId

### ChangeRequest
**Purpose**: Tracks change requests submitted by directors for entity modifications
- `requestId`: Auto-generated unique identifier (Primary Key)
- `directorId`: Reference to requesting director's UserProfile.userId (Foreign Key)
- `entityId`: Target Company.id or LLP.id (Foreign Key)
- `entityType`: 'COMPANY' | 'LLP' (indicates which table entityId references)
- `changeType`: UPDATE_INFO | ADD_DIRECTOR | REMOVE_DIRECTOR | STATUS_CHANGE | OTHER
- `requestDetails`: Text description of requested change (required)
- `status`: PENDING | APPROVED | REJECTED | COMPLETED
- `createdAt`: Request creation timestamp
- `updatedAt`: Last modification timestamp
- `processedBy`: Professional UserProfile.userId who processed the request
- `comments`: Additional notes from processing professional
**Relationship**: `requestor` belongsTo UserProfile via directorId

## Key Features & Implementation Status

### ✅ Name Reservation System
**Purpose**: Multi-step entity creation process starting with name reservation
**Implementation**: Complete for name reservation step
**Form Fields**:
- First Proposed Name (required)
- Second Proposed Name (required)  
- Proposed Object/Business Description (required)
- Trademarked Status (radio: Yes/No)
- Conditional Trademark Fields: Word Mark, Class, PAN Number
- Significance of Name (required)

**Process Flow**:
1. **Name Reservation** ✅ - Currently implemented with localStorage storage
2. **SPiCe Form Generation** 🚧 - Planned
3. **SPiCe Form Completion** 🚧 - Planned  
4. **Final Registration** 🚧 - Planned

**Current Storage**: localStorage (temporary, needs TempEntity database model)

### ✅ Service Management System  
**Purpose**: Service-based action system for entity management
**Implementation**: Modal-based service selection with action workflows

**Implemented Services**:
- **Incorporation Service**: Certificate viewing, detail updates, office changes, MOA/AOA modifications
  - Actions: View Certificate, Update Details, Change Registered Office, Modify MOA/AOA

**Planned Services**:
- **Annual Filing Service**: MGT-7, AOC-4, Director Report, Shareholders List
- **Board Meeting Service**: AGM Minutes, Board Minutes, Resolutions

### ✅ Role-Based Access Control
**Implementation**: Cognito User Pool groups with role-based UI rendering
- Role selection on first login with localStorage persistence
- Different dashboards and feature sets per role
- Automatic profile creation/merging for email-based director lookup

### ✅ Professional Assignment System
**Purpose**: System for assigning compliance professionals to manage entities  
**Features**:
- Automatic assignment when professional creates entity
- Professional association tracking in database
- Director visibility into assigned professionals
- Email-based director lookup and profile creation

## Component Architecture

### Authentication Components
- **CustomAuthenticator** (`src/components/CustomAuthenticator.tsx`)
  - Custom authentication wrapper with role selection
  - Handles Cognito sign-up/sign-in flows
  - Role selection modal integration

### Director Components  
- **DirectorDashboard** (`src/components/director/DirectorDashboard.tsx`)
  - Main dashboard with 6 tabs for comprehensive entity management
  - Features: Associations, Companies, LLPs, Professional Associations, Entities in Progress, Change Requests
  - Real-time data fetching and association lookup
  
- **NameReservationForm** (`src/components/director/NameReservationForm.tsx`)
  - Multi-section form for entity name reservation
  - Conditional trademark fields with validation
  - Integrated with entity creation workflow

### Professional Components
- **ProfessionalDashboard** (`src/components/professional/ProfessionalDashboard.tsx`)
  - Main dashboard with 3 tabs for entity and director management
  - Features: Company management, LLP management, Director associations
  - Service modal integration for entity actions

- **ServiceModal** (`src/components/professional/ServiceModal.tsx`)
  - Modal interface for service selection and action execution
  - Breadcrumb navigation for service → action workflows
  - Extensible service definition system

- **CompanyForm** (`src/components/professional/CompanyForm.tsx`)
  - Comprehensive company creation form with validation
  - Returns company ID for professional assignment
  
- **LLPForm** (`src/components/professional/LLPForm.tsx`)
  - LLP creation form with partnership-specific fields
  - Returns LLP ID for professional assignment

- **AssociateDirectorForm** (`src/components/professional/AssociateDirectorForm.tsx`)
  - Email-based director lookup and association
  - Automatic UserProfile creation for new directors
  - Entity selection with type-based filtering

#### Authorization Simplification
The current implementation uses `allow.authenticated()` for all models due to complexity in group-based authorization. There are TODO comments indicating the need to:
1. Implement Lambda triggers for automatic Cognito group assignment
2. Restore proper group-based authorization
3. Test role-based permissions thoroughly
4. Consider API-level role checks as additional security

#### Entity Relationship Handling
The schema avoids direct polymorphic relationships by:
- Using `entityId` + `entityType` fields in junction tables
- Handling Company/LLP relationships via queries instead of direct hasMany
- Building lookup maps in the frontend for display purposes

## Key User Flows

### Professional Workflow
1. **Login** → Role Selection (Professional) → Professional Dashboard
2. **Create Entity** → Company/LLP Form → Auto-assignment to entity
3. **Associate Director** → Email lookup → Create/link UserProfile → Create DirectorAssociation
4. **Manage Entities** → View/Edit via Service Modal → Service selection → Action execution

### Director Workflow  
1. **Login** → Role Selection (Director) → Director Dashboard
2. **View Associations** → See all linked companies/LLPs → View assigned professionals
3. **Create Entity** → Name Reservation Form → Submit for professional review
4. **Track Progress** → Monitor entities in various stages → Continue workflow steps

### Role Switching
- Users can sign out and select different role on re-login
- Profile merging handles email-based profiles created by professionals
- Role persistence ensures smooth user experience

## File Structure & Configuration

### Core Application Structure
```
src/
├── App.tsx                           # Main app with role selection logic & user profile management
├── main.tsx                          # Entry point with Amplify configuration & Authenticator
├── components/
│   ├── director/
│   │   ├── DirectorDashboard.tsx     # 6-tab director interface with real-time data
│   │   ├── DirectorDashboard.css     # Professional responsive styling
│   │   ├── NameReservationForm.tsx   # Multi-section entity creation form
│   │   └── NameReservationForm.css   # Form-specific styling
│   ├── professional/
│   │   ├── ProfessionalDashboard.tsx # 3-tab professional interface
│   │   ├── ProfessionalDashboard.css # Dashboard styling
│   │   ├── CompanyForm.tsx           # Company creation with ID return
│   │   ├── LLPForm.tsx              # LLP creation with ID return
│   │   ├── AssociateDirectorForm.tsx # Email-based director association
│   │   ├── ServiceModal.tsx          # Service selection & action execution
│   │   ├── ServiceModal.css          # Modal styling
│   │   └── Forms.css                 # Shared form styling
│   ├── CustomAuthenticator.tsx       # Cognito wrapper with role selection
│   ├── RoleSelector.tsx              # Standalone role selection component  
│   ├── RoleSelector.css              # Role selector styling
│   └── [legacy]                      # Unused routing components (marked for cleanup)
├── context/
│   └── RoleContext.tsx               # Role state management context
├── App.css                           # Global app styling
└── index.css                         # Base styles and theme
```

### Backend Configuration  
```
amplify/
├── auth/resource.ts                  # Cognito User Pools with email login + groups
├── data/resource.ts                  # GraphQL schema with 6 models + simplified auth
├── backend.ts                        # Amplify Gen 2 backend definition
├── package.json                      # Backend dependencies
└── tsconfig.json                     # TypeScript configuration
```

### Configuration Files
```
project-manifest.json                 # Comprehensive project documentation
package.json                         # Frontend dependencies and scripts  
tsconfig.json                        # TypeScript compiler options
vite.config.ts                       # Vite build configuration
amplify.yml                          # Amplify deployment pipeline
.gitignore                           # Git ignore rules (includes amplify outputs)
```

## Integration Points

### MCA.gov.in Integration
- **Company Master Dashboard**: Link to official MCA company data
- **Data Verification**: Cross-reference with government records
- **Status Updates**: Sync with official company status changes

### Planned Services Integration
Based on requirements document, the following services need implementation:

#### Core Compliance Services
- **Annual Filing**: MGT-7, AOC-4, Director Report, Shareholders List
- **Director Management**: Appointments, Resignations, KYC updates
- **Corporate Changes**: Registered office changes, MOA/AOA amendments
- **Meeting Management**: AGM Minutes, Board Minutes, Resolutions
- **Financial Services**: Auditor appointments, Bank account opening
- **Share Management**: Transfer of shares processing

#### Document Management
- **Template System**: Pre-configured forms for each service
- **Wet Ink Signatures**: Digital signature workflows
- **Document Repository**: Secure storage of completed documents
- **Status Tracking**: Info Received → In Process/Clarification → Completion

## Future Enhancement Roadmap

### High Priority (Next Sprint)
1. **Database Enhancement**
   - Implement TempEntity model for proper entity creation tracking
   - Replace localStorage with database persistence for name reservations
   - Add audit trail and change tracking capabilities

2. **Workflow Completion**  
   - Complete multi-step entity creation process beyond name reservation
   - Implement SPiCe form generation and completion workflows
   - Add final registration and certificate generation steps

3. **Security & Authorization**
   - Implement Lambda triggers for automatic Cognito group assignment  
   - Restore proper group-based authorization rules
   - Add comprehensive input validation and error handling
   - Implement API-level role checks for additional security

### Medium Priority (Future Sprints)
4. **Notification System**
   - Real-time notifications for status changes and assignments
   - Email/SMS integration for important updates
   - Dashboard notification center

5. **Reporting & Analytics**
   - Compliance reporting dashboard for professionals
   - Entity status analytics and tracking
   - Performance metrics and KPI monitoring
   - Export capabilities for compliance reports

6. **Advanced Service Management**
   - Complete implementation of Annual Filing Service workflows
   - Board Meeting Service with meeting management
   - Document template system for common services
   - Wet ink signature integration for digital document signing

### Low Priority (Long-term)
7. **Document Management**
   - File upload and document storage system
   - Document repository with version control
   - Integration with external document signing services
   - OCR and document processing capabilities

8. **Integration & Scalability**
   - MCA.gov.in API integration for real-time data sync
   - Payment gateway integration for service fees
   - Multi-tenant support for compliance agencies
   - Mobile app development for iOS/Android

9. **Advanced Features**
   - Bulk operations for managing multiple entities
   - Advanced search and filtering capabilities
   - Custom dashboard widgets and layouts
   - API access for third-party integrations

## Environment Setup & Development

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Amplify CLI installed globally (`npm install -g @aws-amplify/cli`)
- Git for version control

### Development Commands
```bash
# Initial setup
npm install                    # Install frontend dependencies  
cd amplify && npm install      # Install backend dependencies

# Development workflow  
npm run dev                   # Start Vite development server (localhost:5173)
npx ampx sandbox              # Start Amplify sandbox environment
npx ampx sandbox --watch      # Start sandbox with auto-reload on changes

# Build and deployment
npm run build                 # Build frontend for production
npm run preview               # Preview production build locally
git push origin main          # Trigger Amplify CI/CD deployment

# Code quality
npm run lint                  # Run ESLint for code quality checks
npm run lint -- --fix        # Auto-fix linting issues
```

### Amplify Configuration Files
- `amplify_outputs.json` - Generated config file (gitignored)
- `amplifyconfiguration.json` - Generated config file (gitignored)  
- `amplify.yml` - CI/CD pipeline configuration for AWS Amplify hosting

### Environment Variables
Currently using Amplify's automatic configuration generation. No manual environment variables required for basic setup.

### Development Workflow
1. Make changes to source code
2. Test locally with `npm run dev` + `npx ampx sandbox`
3. Commit changes to main branch
4. AWS Amplify automatically builds and deploys via GitHub integration

## Data Access Patterns & Query Examples

### Professional Queries (Entity Management)
```typescript
// Get professional's assigned entities
const assignments = await client.models.ProfessionalAssignment.list({
  filter: { 
    and: [
      { professionalId: { eq: user.username }}, 
      { isActive: { eq: true }}
    ]
  }
});

// Get specific entity details
const company = await client.models.Company.get({ id: entityId });
const llp = await client.models.LLP.get({ id: entityId });

// Create professional assignment (auto-assignment on entity creation)
await client.models.ProfessionalAssignment.create({
  professionalId: user.username,
  entityId: companyId,
  entityType: 'COMPANY',
  assignedDate: new Date().toISOString().split('T')[0],
  isActive: true,
  role: 'PRIMARY'
});
```

### Director Queries (Association Management)
```typescript
// Get director's entity associations
const associations = await client.models.DirectorAssociation.list({
  filter: { 
    and: [
      { userId: { eq: directorUserId }}, 
      { isActive: { eq: true }}
    ]
  }
});

// Get professional assignments for director's entities
const professionals = await client.models.ProfessionalAssignment.list({
  filter: {
    or: entityIds.map(entityId => ({ entityId: { eq: entityId }}))
  }
});

// Find or create director by email (Professional workflow)
const existingUsers = await client.models.UserProfile.list({
  filter: { email: { eq: email.toLowerCase().trim() }}
});
```

### User Profile Management
```typescript
// Check for existing profile (Cognito ID vs Email lookup)
const existingByUserId = await client.models.UserProfile.list({
  filter: { userId: { eq: user.username }}
});

const existingByEmail = await client.models.UserProfile.list({
  filter: { email: { eq: userEmail }}
});

// Create or merge user profile
await client.models.UserProfile.create({
  userId: user.username,
  email: userEmail,
  role: selectedRole as 'DIRECTORS' | 'PROFESSIONALS',
  displayName: userEmail
});
```

## Known Issues & Technical Debt

### Current Limitations
1. **Temporary Auth**: Simplified authentication needs proper group-based rules
2. **localStorage Usage**: Temporary entities stored locally instead of database
3. **Manual Lookups**: Junction table relationships require manual query building
4. **No Real Services**: Service modal is placeholder without actual workflows

### Performance Considerations
1. **N+1 Queries**: Multiple individual entity fetches instead of batch operations
2. **Client-side Joins**: Relationship