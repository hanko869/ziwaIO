# LinkedIn Contact Extractor with Credit System

A Next.js application for extracting contact information from LinkedIn profiles with a credit-based payment system using cryptocurrency (USDT).

## Features

### 🔍 Contact Extraction
- Extract emails and phone numbers from LinkedIn profile URLs
- Single profile extraction
- Bulk extraction via CSV file upload
- **High-performance parallel processing** (100 concurrent requests)
- **Real-time progress tracking** with accurate progress bar
- **Optimized for speed** - 500 URLs in ~1 minute
- Export extracted contacts to CSV immediately

### 💳 Credit System
- Pay-per-extraction model
- USDT cryptocurrency payments via NOWPayments
- Credit packages starting from $10 USDT
- Automatic credit deduction based on extracted data
- Real-time credit balance display

### 👤 User Management
- User authentication system
- Individual user accounts with separate credit balances
- Admin dashboard for user management
- Activity logging and tracking

### 🔐 Admin Features
- View all users and their credit balances
- Manually add/adjust user credits
- Enable/disable user accounts
- View system statistics
- Monitor user activity

## Pricing

### Client Pricing
- **Email extraction**: 1 credit ($0.033 USD)
- **Phone extraction**: 2 credits ($0.067 USD)
- **Email + Phone**: 3 credits ($0.10 USD)

### Credit Packages
- $10 USDT = 300 credits (100 full extractions)
- $30 USDT = 900 credits (300 full extractions)
- $50 USDT = 1,500 credits (500 full extractions)
- $100 USDT = 3,000 credits (1,000 full extractions)

### ROI Information
- Wiza API cost per full extraction: $0.0315
- Client price per full extraction: $0.10

## Performance Optimizations

### 🚀 Speed Improvements (January 2024)
- **10x faster extraction** through optimized concurrency (100 concurrent requests)
- **Eliminated database bottleneck** - removed unnecessary bulk save operations
- **Unified performance** across development and production environments
- **Smart API key rotation** with automatic retry logic
- **Benchmark**: 500 URLs extracted in ~60 seconds

### 📊 Technical Specifications
- **Concurrency**: 100 simultaneous requests (10 per API key × 10 keys max)
- **Progress Tracking**: Real-time in-memory store with singleton pattern
- **API Key Management**: Automatic rotation and retry on failures
- **Memory Efficient**: Streaming results without bulk database writes
- Profit margin: 68.5%
- ROI: 217% return

## Tech Stack

- **Frontend**: Next.js 15.3, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based auth with middleware
- **Payment**: NOWPayments API (cryptocurrency)
- **Contact Extraction**: Wiza API
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Wiza API Keys (supports up to 3 for parallel processing)
WIZA_API_KEY=your_primary_wiza_api_key
WIZA_API_KEY_2=your_second_wiza_api_key (optional)
WIZA_API_KEY_3=your_third_wiza_api_key (optional)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NOWPayments
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
NOWPAYMENTS_SANDBOX=false

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Credit System Configuration
NEXT_PUBLIC_CREDITS_PER_EMAIL=1
NEXT_PUBLIC_CREDITS_PER_PHONE=2
NEXT_PUBLIC_CREDITS_PER_USDT=30
NEXT_PUBLIC_MIN_DEPOSIT_USDT=10

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

## Database Schema

The application uses Supabase with the following main tables:

### users
- id (uuid, primary key)
- username (text, unique)
- email (text)
- password_hash (text)
- is_active (boolean)
- created_at (timestamp)

### credit_balances
- user_id (uuid, foreign key)
- balance (integer)
- updated_at (timestamp)

### credit_transactions
- id (uuid, primary key)
- user_id (uuid, foreign key)
- amount (integer)
- type (text: 'deposit' or 'deduction')
- description (text)
- created_at (timestamp)

### payment_transactions
- id (uuid, primary key)
- user_id (uuid, foreign key)
- payment_id (text)
- amount_usdt (decimal)
- credits_added (integer)
- status (text)
- created_at (timestamp)

### extracted_contacts
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- linkedin_url (text)
- emails (jsonb)
- phones (jsonb)
- extracted_at (timestamp)

### activity_logs
- id (uuid, primary key)
- user_id (uuid, foreign key)
- action (text)
- details (jsonb)
- created_at (timestamp)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hanko869/ziwapro2.git
cd ziwapro2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in all required environment variables

4. Set up Supabase:
- Create a new Supabase project
- Run the database migrations (see Database Setup section)

5. Run the development server:
```bash
npm run dev
```

## Database Setup

Create the following tables in your Supabase project:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Credit balances table
CREATE TABLE credit_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Credit transactions table
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'deduction')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  payment_id TEXT UNIQUE NOT NULL,
  amount_usdt DECIMAL(10,2) NOT NULL,
  credits_added INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Extracted contacts table
CREATE TABLE extracted_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  linkedin_url TEXT,
  emails JSONB DEFAULT '[]',
  phones JSONB DEFAULT '[]',
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication status

### Contact Extraction
- `POST /api/extract-single` - Extract single LinkedIn profile
- `POST /api/extract-bulk-simple` - Bulk extraction with parallel processing
- `GET /api/contacts` - Get user's extracted contacts

### Credits & Payments
- `GET /api/credits` - Get user's credit balance
- `POST /api/payment/create` - Create payment invoice
- `POST /api/payment/check-status` - Check payment status
- `POST /api/payment/webhook` - NOWPayments webhook endpoint

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/[id]` - Update user credits
- `POST /api/admin/users/[id]/toggle` - Enable/disable user
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/activities` - Get activity logs

## Key Features Implementation

### Parallel Extraction
The system uses up to 3 Wiza API keys concurrently to speed up bulk extractions. Each API key processes different profiles simultaneously, reducing total extraction time by up to 3x.

### Payment Processing
- Uses NOWPayments for USDT cryptocurrency payments
- Handles "partially paid" status with 99% tolerance
- Automatic credit allocation upon payment confirmation
- Webhook integration for real-time payment updates

### Progress Tracking
- Real-time progress bar for bulk extractions
- Simulated progress updates for better UX
- Shows current/total extraction count

### Contact Storage
- All contacts stored in database (not localStorage)
- User-specific contact isolation
- Export functionality to CSV format

## Known Issues & Solutions

### Payment Issues
- **Partially Paid Status**: The system accepts payments that are ≥99% of the requested amount due to cryptocurrency decimal limitations
- **Transaction Fees**: Currently, NOWPayments doesn't support forcing users to pay all fees upfront

### Extraction Speed
- Using multiple API keys significantly improves bulk extraction speed
- Maximum concurrent extractions = number of API keys × 2

## Deployment

1. Deploy to Vercel:
```bash
vercel
```

2. Set all environment variables in Vercel dashboard

3. Ensure Supabase database is accessible from Vercel

## Support

For issues or questions:
1. Check the activity logs in the admin dashboard
2. Monitor the browser console for detailed error messages
3. Verify API key credits in the Wiza dashboard
4. Check payment status in NOWPayments dashboard

## License

This project is proprietary software. All rights reserved.