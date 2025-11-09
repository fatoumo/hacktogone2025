# Carbon Scoring Web Application

A Next.js web application that integrates with a Streamlit-based Carbon Scoring platform hosted on Snowflake.

## Features

- **Score Calculator** - Interactive tool to calculate carbon footprint
- **API Documentation** - Comprehensive API reference for developers
- **Data Explorer** - View and analyze historical carbon scoring data
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Seamless Integration** - Embeds Streamlit app with matching theme

## Quick Start

### Prerequisites

- Bun 1.3.1 or higher
- Node.js 18+ (for compatibility)
- Access to Snowflake-hosted Streamlit application

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Streamlit URL
```

### Environment Configuration

Edit `.env.local`:

```env
NEXT_PUBLIC_STREAMLIT_URL=https://snowflake.concon.build
```

Or use your Snowflake app URL:

```env
NEXT_PUBLIC_STREAMLIT_URL=https://your-app.snowflakecomputing.com
```

### Development

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
bun run build
bun start
```

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx                    # Root layout with navigation
│   ├── page.tsx                      # Home page
│   ├── carbon-scoring/
│   │   ├── page.tsx                  # Score Calculator
│   │   ├── api-docs/
│   │   │   └── page.tsx              # API Documentation
│   │   └── data/
│   │       └── page.tsx              # Data Explorer
│   └── globals.css                   # Global styles
├── components/
│   ├── Navigation.tsx                # Site navigation
│   ├── Navigation.module.css
│   ├── StreamlitEmbed.tsx            # Streamlit iframe wrapper
│   └── StreamlitEmbed.module.css
├── public/                           # Static assets
├── .env.local                        # Environment variables (not in git)
├── .env.example                      # Environment template
├── next.config.js                    # Next.js configuration
├── STREAMLIT_INTEGRATION.md          # Integration documentation
└── package.json
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/carbon-scoring` | Score Calculator (Streamlit) |
| `/carbon-scoring/api-docs` | API Documentation (Streamlit) |
| `/carbon-scoring/data` | Data Explorer (Streamlit) |

## Configuration

### Security Headers

Security headers are configured in [next.config.js](./next.config.js):

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Allowed Domains

The following domains are whitelisted for iframe embedding:

- `**.snowflakecomputing.com`
- `snowflake.concon.build`

To add more domains, update `next.config.js`.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_STREAMLIT_URL`
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Docker/Custom server
- CloudFlare Pages

## Styling

The application uses:

- **CSS Modules** for component-scoped styling
- **Geist Fonts** for typography
- **Green Theme** (#00C853) matching Streamlit configuration
- **Responsive Design** with mobile-first approach

## Authentication (Future)

Authentication is planned but currently disabled. See [STREAMLIT_INTEGRATION.md](./STREAMLIT_INTEGRATION.md) for implementation guide.

To prevent abuse, consider:
- Rate limiting (Upstash)
- NextAuth.js integration
- OAuth providers (Google, GitHub)

## Troubleshooting

### Iframe Not Loading

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_STREAMLIT_URL` is set correctly
3. Ensure Snowflake app allows iframe embedding
4. Check CORS configuration on Streamlit side

### Styling Issues

1. Check for CSS conflicts in `globals.css`
2. Adjust iframe height in page components
3. Verify Streamlit theme configuration

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
bun run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server (port 3000) |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run ESLint |
| `bun check-types` | Run TypeScript type checking |

## Technologies

- **Next.js 16.0.0** - React framework
- **React 19.2.0** - UI library
- **TypeScript 5.9.2** - Type safety
- **Bun** - Package manager and runtime
- **CSS Modules** - Scoped styling
- **Streamlit** - Embedded application (Python)

## Documentation

- [Streamlit Integration Guide](./STREAMLIT_INTEGRATION.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Deployment Guide](../../scoring-api/DEPLOYMENT.md)

## Contributing

This is a Hacktogone 2025 project. For contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See root repository for license information.

## Support

For issues or questions:

1. Check [STREAMLIT_INTEGRATION.md](./STREAMLIT_INTEGRATION.md)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Open an issue in the repository
