import { defineBackend } from '@aws-amplify/backend';
// import { auth } from './auth/resource';  // Temporarily disabled for deployment fix
import { data } from './data/resource';

defineBackend({
  // auth,  // Temporarily disabled for deployment fix
  data,
});
