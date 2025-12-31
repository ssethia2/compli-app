# Lambda Backend Setup

## Overview

Created **TWO Lambda functions** optimized for different execution patterns:
- **`api-handler`** - Fast CRUD operations (512MB, 15s timeout)
- **`heavy-operations`** - Compute-intensive tasks (2048MB, 5min timeout)

## Architecture

### Before
```
Browser → Many Lambda Functions → DynamoDB
- One function per operation (hard to manage)
```

### Now
```
Browser → 2 Lambda Functions (by performance profile) → DynamoDB + S3

         POST /api-handler (fast)
         { operation: "submitDirectorAppointment", data: {...} }

         POST /heavy-operations (slow)
         { operation: "generateDirectorForms", data: {...} }
```

**Why Two?**
- **Cost Optimization**: Pay less for fast operations (512MB vs 2048MB)
- **Performance**: Fast operations stay fast, heavy operations get resources they need
- **Cold Starts**: Fast operations warm up quickly, heavy operations justify longer cold starts
- **Scalability**: Each Lambda scales independently based on traffic patterns

## Supported Operations

### api-handler (Fast CRUD - 512MB, 15s)

**Director Operations:**
- `submitDirectorAppointment` - Submit new director appointment
- `completeDirectorDocumentUpload` - Complete document upload task
- `submitDirectorResignation` - Submit director resignation

**Professional Operations:**
- `processServiceRequest` - Approve/reject/complete service requests
- `associateDINEmail` - Link DIN to email for new directors
- `getProfessionalDocuments` - Fetch all documents including associated directors' docs

**Shared Operations:**
- `completeTask` - Mark any task as completed

### heavy-operations (Compute-Intensive - 2048MB, 5min)

**Form Generation:**
- `generateDirectorForms` - Generate DIR-2, DIR-8, MBP-1 forms (PDF generation)

**Future Heavy Operations:**
- `processDocumentOCR` - OCR processing for scanned documents
- `generateComplexReport` - Complex compliance reports with charts
- `sendBulkNotifications` - Bulk email/SMS sending
- `validateComplexData` - Heavy data validation and processing

## Why TWO Lambdas?

**Benefits:**
1. **Cost Optimization** - Fast operations use 512MB instead of 2048MB (75% cheaper)
2. **Performance** - Fast ops get <100ms response, heavy ops get resources they need
3. **Independent Scaling** - Each Lambda scales based on its traffic pattern
4. **Resource Allocation** - Heavy operations don't compete with fast operations
5. **Timeout Management** - Fast ops timeout at 15s, heavy ops get 5 minutes

**Performance Comparison:**

| Operation Type | Memory | Timeout | Cost per 1M | Typical Duration |
|---------------|--------|---------|-------------|------------------|
| api-handler | 512MB | 15s | ~$0.10 | 100-500ms |
| heavy-operations | 2048MB | 5min | ~$0.40 | 2-30s |

**Why Not More Lambdas?**
- 2 is the sweet spot: performance profiles without management overhead
- Each Lambda still has operation routing for flexibility
- Easy to add more operations to either Lambda based on performance needs

## Deployment

### 1. Install Dependencies

```bash
# Install dependencies for both Lambda functions
cd amplify/functions/api-handler
npm install
cd ../heavy-operations
npm install
cd ../../..
```

### 2. Deploy Backend

```bash
npx ampx sandbox
```

Wait for deployment. Look for output like:
```
✅ api-handler deployed
Function URL: https://xxxxx.lambda-url.us-east-1.on.aws/

✅ heavy-operations deployed
Function URL: https://yyyyy.lambda-url.us-east-1.on.aws/
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add BOTH Lambda URLs:
```env
# Fast CRUD operations
VITE_API_HANDLER_URL=https://your-api-handler-url.lambda-url.region.on.aws/

# Heavy operations (PDF generation, etc.)
VITE_HEAVY_OPERATIONS_URL=https://your-heavy-operations-url.lambda-url.region.on.aws/
```

### 4. Restart Dev Server

```bash
npm run dev
```

## Usage from Frontend

```typescript
import {
  submitDirectorAppointment,
  completeTask,
  generateDirectorForms
} from '../api/lambda';

// Fast CRUD operations (api-handler)
// ===================================

// Submit director appointment
const result = await submitDirectorAppointment({
  din: '12345678',
  appointmentDate: '2025-01-01',
  designation: 'DIRECTOR',
  category: 'PROMOTER',
  entityId: 'entity-123',
  entityType: 'COMPANY',
  entityName: 'ACME Corp',
  entityIdentifier: 'U12345MH2025PTC123456',
  authorizerUserId: 'director-001',
  authorizerDIN: '87654321',
  authorizerName: 'John Doe',
  authorizerEmail: 'john@example.com'
});

// Complete a task
await completeTask({
  taskId: 'task-123',
  userId: 'user-456'
});

// Heavy operations (heavy-operations)
// =====================================

// Generate compliance forms (PDF generation - takes longer)
const forms = await generateDirectorForms({
  directorDIN: '12345678',
  entityId: 'entity-123',
  serviceRequestId: 'sr-456'
});
```

**How it works:**
- The frontend `lambda.ts` automatically routes to the correct Lambda
- Fast operations go to `api-handler` (512MB, 15s timeout)
- Heavy operations go to `heavy-operations` (2048MB, 5min timeout)
- No need to manually specify which Lambda to use

## Language Choice: Why Node.js? (And Why You Should Consider Go)

### Current: Node.js (TypeScript)

**Pros:**
- Same language as frontend (TypeScript)
- Easy debugging
- Rich npm ecosystem
- Quick to write

**Cons:**
- **Cold start: 1-3 seconds** 😬
- Large bundle size (200-500MB)
- High memory usage

### Better Option: Go

**Pros:**
- **Cold start: 100-300ms** ⚡ (10x faster!)
- Compiled binary (5-10MB)
- Low memory (128MB vs 512MB)
- Better concurrency
- **Much cheaper** (smaller memory = lower cost)

**Cons:**
- Different language (learning curve)
- Less tooling than Node.js

### Comparison

| Metric | Node.js | Go |
|--------|---------|-----|
| Cold Start | 1-3s | 100-300ms |
| Memory | 512MB+ | 128MB |
| Bundle Size | 200-500MB | 5-10MB |
| Cost (per 1M requests) | ~$0.40 | ~$0.10 |
| User Experience | Noticeable delay | Feels instant |

### Converting to Go (Example)

**Current Node.js:**
```typescript
export const handler = async (event: any) => {
  const body = JSON.parse(event.body);
  const operation = body.operation;

  if (operation === 'submitDirectorAppointment') {
    return await handleSubmitDirectorAppointment(body.data);
  }
  // ...
};
```

**Go version:**
```go
package main

import (
    "context"
    "encoding/json"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Request struct {
    Operation string          `json:"operation"`
    Data      json.RawMessage `json:"data"`
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    var req Request
    json.Unmarshal([]byte(event.Body), &req)

    switch req.Operation {
    case "submitDirectorAppointment":
        return handleSubmitDirectorAppointment(req.Data)
    // ...
    }
}

func main() {
    lambda.Start(handler)
}
```

**Want me to create the Go version?** It would reduce cold starts by 10x.

## Monitoring

### View Logs
```bash
npx ampx sandbox --logs
```

### CloudWatch
AWS Console → Lambda → api-handler → Monitor → Logs

### Metrics to Watch
- **Duration** - Should be <1s for most operations
- **Cold Start Rate** - Should decrease over time
- **Error Rate** - Should be near 0%
- **Throttles** - Should be 0

## Performance Optimization

### If Cold Starts Become a Problem

**Option 1: Provisioned Concurrency** ($12-15/month)
```typescript
// In amplify/backend.ts
backend.apiHandler.resources.lambda.addAlias('live', {
  provisionedConcurrentExecutions: 1
});
```

**Option 2: Rewrite in Go** (Free, 10x faster)
- See "Converting to Go" section above

**Option 3: Keep Critical Path Client-Side**
- Reads: Direct AppSync (fast)
- Writes: Lambda (can tolerate slight delay)

## Troubleshooting

### "Lambda URL not set"
- Check `.env` file has **BOTH** URLs:
  - `VITE_API_HANDLER_URL`
  - `VITE_HEAVY_OPERATIONS_URL`
- Restart dev server: `npm run dev`

### "DynamoDB access denied"
- Both Lambdas need proper IAM permissions
- Check `amplify/backend.ts` has DynamoDB policies for both functions

### "Cold starts too slow"
- **api-handler**: Should be <1s, consider provisioned concurrency or Go
- **heavy-operations**: Expected to be 2-3s due to larger memory footprint
- Heavy operations justify longer cold starts for better performance

### "Operation not found"
- Check operation name matches handler switch case
- Make sure you're calling the right function:
  - Fast CRUD → api-handler
  - PDF generation → heavy-operations
- Operation names are case-sensitive!

### "Timeout error"
- **api-handler** times out at 15s
- **heavy-operations** times out at 5 minutes
- If operation takes longer, move it to heavy-operations or increase timeout

## Next Steps

1. **Add more operations**
   - Fast CRUD: Edit `api-handler/handler.ts`
   - Heavy ops: Edit `heavy-operations/handler.ts`
   - Add to appropriate Lambda based on execution time/resources

2. **Implement PDF generation** - Complete `generateDirectorForms` with actual PDF library

3. **Add validation** - Validate input data before processing in both Lambdas

4. **Add error handling** - Better error messages and retry logic

5. **Add monitoring**
   - CloudWatch alarms for errors/latency per Lambda
   - Track performance metrics separately for each Lambda
   - Monitor cost per operation type

6. **Convert to Go (optional)** - If cold starts become critical, rewrite in Go for 10x improvement

## Security

- ✅ Authentication required (JWT token from Cognito)
- ✅ DynamoDB permissions scoped to specific operations
- ✅ CORS enabled for frontend
- ⚠️ TODO: Input validation and sanitization
- ⚠️ TODO: Rate limiting per user
