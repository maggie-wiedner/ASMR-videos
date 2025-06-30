# Setup Instructions

## 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenAI API Key (for prompt enhancement)
OPENAI_API_KEY=your_openai_api_key_here

# Replicate API Token (for video generation)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Supabase Configuration
# Get these from your Supabase project dashboard -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration (REQUIRED for payments to work)
# Get these from your Stripe dashboard -> Developers -> API keys
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## 2. Supabase Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user_videos table
CREATE TABLE user_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  video_url TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  video_id UUID REFERENCES user_videos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_videos
CREATE POLICY "Users can only see their own videos" ON user_videos
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for payments
CREATE POLICY "Users can only see their own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_videos
CREATE TRIGGER update_user_videos_updated_at BEFORE UPDATE ON user_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 3. Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy your **Project URL** and **anon/public key**
4. Add them to your `.env.local` file

## 4. Google OAuth Setup

### Step 1: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - For development: `https://your-project-id.supabase.co/auth/v1/callback`
   - For production: `https://your-domain.com/auth/v1/callback`
7. Note down your **Client ID** and **Client Secret**

### Step 2: Configure Supabase
1. In your Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and toggle it on
3. Enter your Google **Client ID** and **Client Secret**
4. Save the configuration

### Step 3: Test Google Sign-In
- Users can now click "Continue with Google" to sign in
- After authorization, they'll be redirected back to your app
- The authentication state will be automatically managed

## 5. Authentication Setup

Authentication now supports:
- ✅ **Email/password** sign up and sign in
- ✅ **Google OAuth** one-click sign in
- ✅ **Modal sign-in** from navigation
- ✅ **Automatic session management**

## 6. Stripe Payment Setup (REQUIRED)

The "Purchase Access" button requires Stripe to be configured:

### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create an account or sign in to existing one

### Step 2: Get API Keys
1. In your Stripe dashboard, go to **Developers → API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

### Step 3: Add to Environment Variables
1. Create a `.env.local` file in your project root
2. Add ALL required environment variables:
```env
# Stripe Configuration (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Supabase Configuration (REQUIRED for database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: For enhanced prompt features
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

### Step 4: Restart Development Server
```bash
npm run dev
```

**Note**: Without these environment variables, the payment flow will not work!

## 7. Troubleshooting

### "Purchase Access" Button Not Working

If clicking the button does nothing or shows errors:

1. **Check Browser Console**: Open Developer Tools → Console for detailed error messages
2. **Verify Environment Variables**: Ensure `.env.local` has all required values
3. **Restart Development Server**: After adding environment variables, restart with `npm run dev`

### Common Error Messages

- **"Stripe configuration error"**: Missing or invalid `STRIPE_SECRET_KEY`
- **"Database error"**: Missing or invalid Supabase configuration
- **"Error recording payment: {}"**: Supabase database tables not created (run SQL from Step 2)

### Testing Payment Flow

1. Use Stripe test cards: `4242 4242 4242 4242` (any future date, any CVC)
2. Check Stripe Dashboard → Payments to verify test transactions
3. Check Supabase → Table Editor → `payments` table for recorded payments

## Next Steps

- [x] Add Stripe payment integration
- [ ] Test Google OAuth flow
- [ ] Configure email templates in Supabase
- [ ] Set up production domain redirects

# ASMR Video Generator Setup

## Database Setup

### Individual Prompt Storage

The database has been set up with a `user_prompts` table for storing individual generated prompts. Each prompt is saved individually with session grouping, favorites, and usage tracking.

## Environment Variables

Make sure you have these environment variables set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `OPENAI_API_KEY` - Your OpenAI API key

## Features

### Individual Prompt Storage
- Each generated prompt is saved individually to the database
- Prompts are grouped by generation session for easy browsing
- Users can favorite individual prompts they love
- Track which prompts were used to generate videos
- Advanced filtering and search capabilities
- Prompts are associated with user accounts via RLS policies 