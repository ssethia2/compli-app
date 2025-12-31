import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT!;
const REGION = process.env.AWS_REGION || 'us-east-1';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

export async function graphqlRequest<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const url = new URL(GRAPHQL_ENDPOINT);

  const requestBody = JSON.stringify({ query, variables });

  // Create HTTP request
  const request = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    path: url.pathname,
    body: requestBody
  });

  // Sign request with IAM credentials
  const signer = new SignatureV4({
    service: 'appsync',
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN
    },
    sha256: Sha256
  });

  const signedRequest = await signer.sign(request);

  // Convert headers to plain object for fetch
  const headersObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(signedRequest.headers)) {
    if (typeof value === 'string') {
      headersObj[key] = value;
    }
  }

  console.log('Making GraphQL request to:', GRAPHQL_ENDPOINT);
  console.log('Request headers:', Object.keys(headersObj));

  // Make the request
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: headersObj,
    body: requestBody
  });

  console.log('GraphQL response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GraphQL HTTP error:', errorText);
    throw new Error(`GraphQL HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data as T;
}
