import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { apiHandler } from './functions/api-handler/resource';
import { heavyOperations } from './functions/heavy-operations/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { CfnOutput } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  apiHandler,
  heavyOperations
});

// Grant Lambda functions access to AppSync GraphQL API
const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;
const graphqlApiArn = `arn:aws:appsync:${dataStack.region}:${dataStack.account}:apis/${backend.data.resources.graphqlApi.apiId}/*`;

// Grant api-handler access to GraphQL API
backend.apiHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'appsync:GraphQL'
    ],
    resources: [
      graphqlApiArn
    ]
  })
);

// Grant heavy-operations access to GraphQL API
backend.heavyOperations.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'appsync:GraphQL'
    ],
    resources: [
      graphqlApiArn
    ]
  })
);

// Add GraphQL API endpoint as environment variable
// Access the GraphQL URL from the CFN GraphQL API resource
const graphqlUrl = backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl;
backend.apiHandler.addEnvironment('GRAPHQL_ENDPOINT', graphqlUrl);
backend.heavyOperations.addEnvironment('GRAPHQL_ENDPOINT', graphqlUrl);

// Grant heavy-operations access to S3
backend.heavyOperations.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject',
      's3:ListBucket'
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`
    ]
  })
);

// Add S3 bucket name for heavy-operations
backend.heavyOperations.addEnvironment('STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);

// Enable Function URLs for Lambda functions so they can be called from the frontend
const apiHandlerUrl = backend.apiHandler.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Lambda will verify Cognito JWT token internally
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['*'],
  }
});

const heavyOpsUrl = backend.heavyOperations.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Lambda will verify Cognito JWT token internally
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['*'],
  }
});

// Output the Function URLs so they appear in deployment output
new CfnOutput(backend.apiHandler.stack, 'ApiHandlerFunctionUrl', {
  value: apiHandlerUrl.url,
  description: 'API Handler Lambda Function URL'
});

new CfnOutput(backend.heavyOperations.stack, 'HeavyOperationsFunctionUrl', {
  value: heavyOpsUrl.url,
  description: 'Heavy Operations Lambda Function URL'
});

// Note: Lambda handlers will discover the DynamoDB table name at runtime
// AWS_REGION is automatically available as an environment variable in Lambda
