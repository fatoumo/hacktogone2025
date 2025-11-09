# Streamlit Integration Documentation

## Overview

This Next.js application integrates a Streamlit-based Carbon Scoring application hosted on Snowflake. The integration uses iframe embedding to display three main pages from the Streamlit app.

## Architecture

### Components

1. **StreamlitEmbed Component** (`components/StreamlitEmbed.tsx`)
   - Reusable component that embeds Streamlit pages via iframe
   - Handles loading states and error handling
   - Supports dynamic page routing
   - Configurable height and styling

2. **Navigation Component** (`components/Navigation.tsx`)
   - Site-wide navigation with links to all pages
   - Active route highlighting
   - Responsive design for mobile/tablet
   - Matches Streamlit's green theme (#00C853)

3. **Pages**
   - `/carbon-scoring` - Score Calculator
   - `/carbon-scoring/api-docs` - API Documentation
   - `/carbon-scoring/data` - Data Explorer

## Configuration

### Environment Variables

Set the following in your `.env.local` file:

```env
NEXT_PUBLIC_STREAMLIT_URL=https://snowflake.concon.build
```

Or use your Snowflake-hosted URL:

```env
NEXT_PUBLIC_STREAMLIT_URL=https://app-hacktogone2025.snowflakecomputing.com
```

### Security Headers

The `next.config.js` file includes:
- X-Frame-Options for iframe security
- X-Content-Type-Options to prevent MIME sniffing
- Referrer-Policy for privacy
- Image domains whitelist for Snowflake

### Custom Domain Setup

If using `snowflake.concon.build`:

1. Configure DNS CNAME record pointing to your Snowflake app URL
2. Update `NEXT_PUBLIC_STREAMLIT_URL` in `.env.local`
3. Verify the domain is whitelisted in `next.config.js` (already configured)

## Streamlit Page Mapping

The Streamlit app has three pages with the following identifiers:

| Page Name | Streamlit ID | Next.js Route |
|-----------|-------------|---------------|
| Score Calculator | `Score_Calculator` | `/carbon-scoring` |
| API Documentation | `API_Documentation` | `/carbon-scoring/api-docs` |
| Data Explorer | `Data_Explorer` | `/carbon-scoring/data` |

## Authentication (Future Implementation - Low Priority)

### Placeholder for Authentication

The navigation component includes commented-out authentication UI. To implement:

1. **Choose an Auth Provider:**
   - NextAuth.js (recommended for Next.js)
   - Auth0
   - Clerk
   - Supabase Auth

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_AUTH_ENABLED=true
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

3. **Protect Routes:**
   Create a middleware file at `apps/web/middleware.ts`:
   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     // Check if user is authenticated
     const isAuthenticated = request.cookies.get('auth-token');

     if (!isAuthenticated && request.nextUrl.pathname.startsWith('/carbon-scoring')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }

     return NextResponse.next();
   }

   export const config = {
     matcher: '/carbon-scoring/:path*',
   };
   ```

4. **Add Login UI:**
   - Uncomment the login button in `components/Navigation.tsx`
   - Create `/app/login/page.tsx`
   - Implement authentication flow

5. **Secure Streamlit Access:**
   - Pass auth tokens to Streamlit via URL parameters or postMessage
   - Update StreamlitEmbed component to include auth headers
   - Configure CORS on Snowflake side to accept tokens

### Rate Limiting (to prevent abuse)

Consider implementing rate limiting:

1. **Using Upstash Redis + Vercel:**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. **API Route Protection:**
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   });

   export async function middleware(request: NextRequest) {
     const ip = request.ip ?? '127.0.0.1';
     const { success } = await ratelimit.limit(ip);

     if (!success) {
       return new Response('Too Many Requests', { status: 429 });
     }

     return NextResponse.next();
   }
   ```

## Development

### Running Locally

```bash
cd apps/web
bun install
bun dev
```

The app will run on `http://localhost:3000`.

### Building for Production

```bash
bun run build
bun start
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_STREAMLIT_URL`
3. Deploy!

### Custom Domain Configuration

If deploying with a custom domain:

1. Update `NEXT_PUBLIC_STREAMLIT_URL` in production environment
2. Ensure DNS records are properly configured
3. Update `next.config.js` if using domains other than those already whitelisted

## Troubleshooting

### Iframe Not Loading

- **Check CORS:** Ensure Snowflake app allows embedding
- **Verify URL:** Check `NEXT_PUBLIC_STREAMLIT_URL` is correct
- **Browser Console:** Look for security or network errors

### Styling Issues

- **Adjust Height:** Modify the `height` prop in page components
- **CSS Conflicts:** Check for global styles affecting iframe

### Page Navigation

- **Streamlit Sidebar:** The Streamlit app may have its own navigation
- **URL Parameters:** The `?page=` parameter routes to specific Streamlit pages
- **Deep Linking:** You may need to adjust page IDs if Streamlit updates

## Future Enhancements

- [ ] Implement authentication (NextAuth.js)
- [ ] Add rate limiting to prevent abuse
- [ ] Create custom React components to replace Streamlit UI (for better UX)
- [ ] Add analytics tracking
- [ ] Implement server-side rendering for better SEO
- [ ] Create API routes to proxy Streamlit API calls
- [ ] Add error boundary components
- [ ] Implement progressive web app (PWA) features

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Streamlit Documentation](https://docs.streamlit.io)
- [Snowflake Streamlit Deployment](https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit)
- [NextAuth.js](https://next-auth.js.org/)
