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

# Stripe Configuration (for payments) - Coming soon!
# STRIPE_SECRET_KEY=your_stripe_secret_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
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

## 4. Authentication Setup

Authentication is already configured! Users can:
- Sign up with email/password
- Sign in to access the video generator
- Sign out from the navigation

## Next Steps

- [ ] Add Stripe payment integration
- [ ] Test the database setup
- [ ] Configure email templates in Supabase 