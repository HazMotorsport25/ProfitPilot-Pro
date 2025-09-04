# ProfitPilot Pro

A comprehensive e-commerce profit calculator designed for Shopify and eBay sellers. Built with the 5 Day Sprint Framework by Omar Choudhry.

## Features

- 🧮 **Profit Calculator**: Calculate accurate profit margins with VAT, shipping costs, and custom targets
- 📦 **Courier Selection**: Compare shipping costs across different UK courier services
- ⚠️ **Profit Alerts**: Get red flag alerts for products that don't meet profit targets
- 📈 **VAT Calculator**: Handle input/output VAT calculations seamlessly
- 💰 **Margin Formula**: Set custom margin formulas based on profit percentage targets

## Tech Stack

- **Next.js 15** with TypeScript
- **Tailwind CSS v4** with OKLCH colors
- **shadcn/ui** component library
- **Supabase** for database and authentication
- **React Hook Form** with Zod validation

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles with Tailwind v4
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── profit-calculator.tsx  # Main calculator component
└── lib/               # Utilities
    ├── utils.ts       # Utility functions
    └── supabase.ts    # Supabase client
```

## Environment Variables

The project uses the following environment variables (stored in `.env.local`):

```
# Project Context
USER_FIRST_NAME=Hasnain
PROJECT_NAME=ProfitPilot Pro

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys (add as needed)
FIRECRAWL_API_KEY=your_firecrawl_key
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

If you encounter PostCSS/Tailwind errors:
1. Ensure `@tailwindcss/postcss` is installed
2. Check `postcss.config.js` uses the correct plugin syntax
3. Restart the development server

## Built with 5 Day Sprint Framework

This project was created using the 5 Day Sprint Framework by Omar Choudhry. Learn more at [5daysprint.com](https://5daysprint.com).

## Next Steps

- Add bulk import/export functionality
- Implement Supabase database tables for product storage
- Add user authentication
- Create product management dashboard
- Integrate with Shopify/eBay APIs