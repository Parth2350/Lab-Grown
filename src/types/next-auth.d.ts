import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    /** a welcome code issued at this sign-in, until the shopper has seen it */
    welcome?: string;
    user: {
      id: string;
      role: 'ADMIN' | 'CUSTOMER';
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role?: 'ADMIN' | 'CUSTOMER';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    role?: 'ADMIN' | 'CUSTOMER';
  }
}
